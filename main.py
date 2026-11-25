import os
import re
import sys
import time
import threading
import subprocess
import webbrowser
import uvicorn
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL")

DB_CONFIG = {
    "dbname": "postgres",
    "user": "postgres",
    "password": "2",  # Mật khẩu PostgreSQL trên máy cá nhân
    "host": "127.0.0.1",
    "port": "5432"
}


def get_db_connection():
    if DATABASE_URL:
        return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    return psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)


def normalize_area_id(raw_id: str) -> str:
    """Chuyển đổi đồng nhất mọi dạng mã area_id (hex 20 ký tự GEE hoặc số) về chuẩn 'X_0' trong CSDL"""
    s = str(raw_id).strip()
    if not s or s.upper() == "ALL":
        return "ALL"
    base = s.replace("_0", "")
    if len(base) == 20 and all(c in "0123456789abcdefABCDEF" for c in base):
        try:
            num = int(base[-8:], 16)
            return f"{num}_0"
        except ValueError:
            pass
    return f"{base}_0"


# =========================================================================
# 0. API ĐĂNG NHẬP & QUẢN TRỊ PHÂN QUYỀN (ADMIN / CHUYEN_GIA / NGUOI_DUNG)
# =========================================================================
class LoginRequest(BaseModel):
    username: str
    password: str


class UserUpdateRequest(BaseModel):
    role: str
    is_active: bool


@app.post("/api/login")
def login_user(req: LoginRequest):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT user_id, username, full_name, role, is_active
            FROM public.nguoi_dung
            WHERE username = %s AND password_hash = %s
            """,
            (req.username.strip(), req.password.strip())
        )
        user = cursor.fetchone()
        cursor.close()
        if not user:
            raise HTTPException(status_code=401, detail="Sai tên đăng nhập hoặc mật khẩu!")
        if not user["is_active"]:
            raise HTTPException(status_code=403, detail="Tài khoản đã bị Quản trị viên vô hiệu hóa!")
        return {"status": "success", "user": user}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


@app.get("/api/admin/users")
def get_all_users():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT user_id, username, full_name, role, is_active, created_at::text
            FROM public.nguoi_dung
            ORDER BY user_id ASC;
        """)
        rows = cursor.fetchall()
        cursor.close()
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


@app.put("/api/admin/users/{user_id}")
def update_user_role(user_id: int, req: UserUpdateRequest):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE public.nguoi_dung SET role = %s, is_active = %s WHERE user_id = %s;",
            (req.role.strip(), req.is_active, user_id)
        )
        conn.commit()
        cursor.close()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


@app.get("/api/admin/stats")
def get_admin_stats():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) AS c FROM public.ve_tinh_quan_trac;")
        obs = cursor.fetchone()["c"]
        cursor.execute("SELECT COUNT(*) AS c FROM public.ai_du_bao_tuong_lai;")
        fc = cursor.fetchone()["c"]
        cursor.execute("SELECT COUNT(DISTINCT area_id) AS c FROM public.ve_tinh_quan_trac;")
        areas = cursor.fetchone()["c"]
        cursor.close()
        return {"obs_count": obs, "forecast_count": fc, "area_count": areas}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


# =========================================================================
# 1. API LẤY DỮ LIỆU TÔ MÀU BẢN ĐỒ (ĐẢM BẢO PHỦ KÍN 100% KHU VỰC TỪ CSDL)
# =========================================================================
@app.get("/api/quan-trac")
def get_quan_trac_data(
    date: str = Query("2026-11-13"),
    metric: str = Query("NDVI"),
    mode: str = Query("day"),
    enable_ai: bool = Query(True)
):
    metric_upper = metric.upper().strip()
    clean_date = date[:10] if len(date) >= 10 else "2026-11-13"

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # CHẾ ĐỘ XEM THEO THÁNG (Tổng hợp trung bình cả tháng từ CSDL)
        if mode == "month":
            year_month = clean_date[:7]
            if enable_ai:
                query = """
                    SELECT area_id, ROUND(AVG(val)::numeric, 4) AS value
                    FROM (
                        SELECT area_id, value AS val
                        FROM public.ve_tinh_quan_trac
                        WHERE UPPER(index_id) = %s AND TO_CHAR(observation_date, 'YYYY-MM') = %s
                        UNION ALL
                        SELECT area_id, predicted_value AS val
                        FROM public.ai_du_bao_tuong_lai
                        WHERE UPPER(index_id) = %s AND TO_CHAR(forecast_date, 'YYYY-MM') = %s
                    ) sub
                    GROUP BY area_id;
                """
                cursor.execute(query, (metric_upper, year_month, metric_upper, year_month))
            else:
                query = """
                    SELECT area_id, ROUND(AVG(value)::numeric, 4) AS value
                    FROM public.ve_tinh_quan_trac
                    WHERE UPPER(index_id) = %s AND TO_CHAR(observation_date, 'YYYY-MM') = %s
                    GROUP BY area_id;
                """
                cursor.execute(query, (metric_upper, year_month))

            rows = cursor.fetchall()
            if len(rows) < 168:
                existing_ids = {normalize_area_id(r["area_id"]) for r in rows}
                fallback_q = """
                    SELECT DISTINCT ON (area_id) area_id, ROUND(value::numeric, 4) AS value
                    FROM public.ve_tinh_quan_trac
                    WHERE UPPER(index_id) = %s AND value IS NOT NULL
                    ORDER BY area_id, ABS(EXTRACT(EPOCH FROM (observation_date::timestamp - %s::timestamp))) ASC;
                """
                cursor.execute(fallback_q, (metric_upper, clean_date))
                for fb_row in cursor.fetchall():
                    if normalize_area_id(fb_row["area_id"]) not in existing_ids:
                        rows.append(fb_row)

            cursor.close()
            return rows

        # CHẾ ĐỘ XEM THEO NGÀY (Phủ kín 100% 168 khu vực -> Không bao giờ có ô xám)
        if enable_ai:
            query = """
                SELECT DISTINCT ON (area_id) area_id, ROUND(predicted_value::numeric, 4) AS value
                FROM public.ai_du_bao_tuong_lai
                WHERE UPPER(index_id) = %s AND predicted_value IS NOT NULL
                ORDER BY area_id, ABS(EXTRACT(EPOCH FROM (forecast_date::timestamp - %s::timestamp))) ASC;
            """
            cursor.execute(query, (metric_upper, clean_date))
            rows = cursor.fetchall()

            # Nếu bảng AI Dự báo thiếu bất kỳ khu vực nào -> tự động bù từ dữ liệu quan trắc gần nhất
            if len(rows) < 168:
                existing_ids = {normalize_area_id(r["area_id"]) for r in rows}
                fb_q = """
                    SELECT DISTINCT ON (area_id) area_id, ROUND(value::numeric, 4) AS value
                    FROM public.ve_tinh_quan_trac
                    WHERE UPPER(index_id) = %s AND value IS NOT NULL
                    ORDER BY area_id, ABS(EXTRACT(EPOCH FROM (observation_date::timestamp - %s::timestamp))) ASC;
                """
                cursor.execute(fb_q, (metric_upper, clean_date))
                for fb_row in cursor.fetchall():
                    if normalize_area_id(fb_row["area_id"]) not in existing_ids:
                        rows.append(fb_row)
        else:
            query = """
                SELECT DISTINCT ON (area_id) area_id, ROUND(value::numeric, 4) AS value
                FROM public.ve_tinh_quan_trac
                WHERE UPPER(index_id) = %s AND value IS NOT NULL
                ORDER BY area_id, ABS(EXTRACT(EPOCH FROM (observation_date::timestamp - %s::timestamp))) ASC;
            """
            cursor.execute(query, (metric_upper, clean_date))
            rows = cursor.fetchall()

        cursor.close()
        return rows
    except Exception as e:
        print("Lỗi API quan-trac:", e)
        return []
    finally:
        if conn:
            conn.close()


# =========================================================================
# 2. API LẤY CHUỖI THỜI GIAN TỪ CSDL (ĐẢM BẢO ĐỦ CHUỖI LIÊN TỤC CHO TỪNG KHU VỰC)
# =========================================================================
@app.get("/api/time-series")
def get_time_series_data(
    area_id: str = Query("ALL"),
    metric: str = Query("NDVI"),
    start_date: str = Query(None),
    end_date: str = Query(None),
    mode: str = Query("day")
):
    metric_upper = metric.upper().strip()
    raw_id = str(area_id).strip()
    norm_id = normalize_area_id(raw_id)
    clean_id = norm_id.replace("_0", "")

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        if norm_id == "ALL":
            query = """
                SELECT 
                    observation_date::text AS record_date, 
                    ROUND(AVG(value)::numeric, 4) AS val, 
                    'past' AS data_type 
                FROM public.ve_tinh_quan_trac 
                WHERE UPPER(index_id) = %s AND value IS NOT NULL
                GROUP BY observation_date
                
                UNION ALL
                
                SELECT 
                    forecast_date::text AS record_date, 
                    ROUND(AVG(predicted_value)::numeric, 4) AS val, 
                    'forecast' AS data_type 
                FROM public.ai_du_bao_tuong_lai 
                WHERE UPPER(index_id) = %s AND predicted_value IS NOT NULL
                GROUP BY forecast_date
                
                ORDER BY record_date ASC;
            """
            cursor.execute(query, (metric_upper, metric_upper))
            rows = cursor.fetchall()
            cursor.close()
            return rows

        # 1. Lấy toàn bộ dữ liệu quan trắc quá khứ của riêng khu vực được chọn
        cursor.execute(
            """
            SELECT observation_date::text AS record_date, ROUND(value::numeric, 4) AS val
            FROM public.ve_tinh_quan_trac
            WHERE UPPER(index_id) = %s AND area_id IN (%s, %s, %s) AND value IS NOT NULL
            ORDER BY observation_date ASC;
            """,
            (metric_upper, raw_id, norm_id, clean_id)
        )
        area_past = {r["record_date"][:10]: float(r["val"]) for r in cursor.fetchall()}

        # 2. Lấy toàn bộ dữ liệu AI dự báo của riêng khu vực được chọn
        cursor.execute(
            """
            SELECT forecast_date::text AS record_date, ROUND(predicted_value::numeric, 4) AS val
            FROM public.ai_du_bao_tuong_lai
            WHERE UPPER(index_id) = %s AND area_id IN (%s, %s, %s) AND predicted_value IS NOT NULL
            ORDER BY forecast_date ASC;
            """,
            (metric_upper, raw_id, norm_id, clean_id)
        )
        area_fc = {r["record_date"][:10]: float(r["val"]) for r in cursor.fetchall()}

        # 3. Lấy danh sách toàn bộ mốc ngày quan trắc & dự báo chuẩn của hệ thống
        cursor.execute(
            """
            SELECT DISTINCT observation_date::text AS d
            FROM public.ve_tinh_quan_trac
            WHERE UPPER(index_id) = %s AND value IS NOT NULL
            ORDER BY d ASC;
            """,
            (metric_upper,)
        )
        all_past_dates = [r["d"][:10] for r in cursor.fetchall()]

        cursor.execute(
            """
            SELECT DISTINCT forecast_date::text AS d
            FROM public.ai_du_bao_tuong_lai
            WHERE UPPER(index_id) = %s AND predicted_value IS NOT NULL
            ORDER BY d ASC;
            """,
            (metric_upper,)
        )
        all_fc_dates = [r["d"][:10] for r in cursor.fetchall()]

        if not area_past and not area_fc:
            cursor.close()
            return get_time_series_data(area_id="ALL", metric=metric, mode=mode)

        result = []

        # Lấp đầy các ngày quan trắc quá khứ bị thiếu của khu vực bằng giá trị gần nhất của chính khu vực đó
        past_keys = sorted(area_past.keys())
        for d in all_past_dates:
            if d in area_past:
                val = area_past[d]
            elif past_keys:
                nearest_d = min(past_keys, key=lambda x: abs(int(x.replace("-", "")) - int(d.replace("-", ""))))
                val = area_past[nearest_d]
            else:
                continue
            result.append({"record_date": d, "val": round(val, 4), "data_type": "past"})

        # Lấp đầy các ngày AI dự báo tương lai của khu vực
        fc_keys = sorted(area_fc.keys())
        last_known_past = area_past[past_keys[-1]] if past_keys else None
        for d in all_fc_dates:
            if d in area_fc:
                val = area_fc[d]
            elif fc_keys:
                nearest_d = min(fc_keys, key=lambda x: abs(int(x.replace("-", "")) - int(d.replace("-", ""))))
                val = area_fc[nearest_d]
            elif last_known_past is not None:
                val = last_known_past
            else:
                continue
            result.append({"record_date": d, "val": round(val, 4), "data_type": "forecast"})

        cursor.close()
        return result
    except Exception as e:
        print("Lỗi API time-series:", e)
        return []
    finally:
        if conn:
            conn.close()


# =========================================================================
# 3. PHỤC VỤ GIAO DIỆN PRODUCTION (dist/) CHO ĐIỆN THOẠI & THIẾT BỊ KHÁC
# =========================================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, "dist")


def mount_frontend_routes():
    if os.path.exists(DIST_DIR):
        assets_dir = os.path.join(DIST_DIR, "assets")
        if os.path.exists(assets_dir):
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

        @app.get("/{full_path:path}")
        def serve_frontend_spa(full_path: str):
            if full_path.startswith("api/"):
                raise HTTPException(status_code=404, detail="API endpoint not found")
            target_file = os.path.join(DIST_DIR, full_path)
            if full_path and os.path.isfile(target_file):
                return FileResponse(target_file)
            return FileResponse(os.path.join(DIST_DIR, "index.html"))


mount_frontend_routes()


# =========================================================================
# 4. HÀM MAIN KHỞI CHẠY TRỌN GÓI TRÊN MÁY CÁ NHÂN
# =========================================================================
def start_cloudflare_tunnel():
    """Tự động chạy Cloudflare Tunnel, in đường link public và copy vào Clipboard"""
    try:
        proc = subprocess.Popen(
            ["cloudflared", "tunnel", "--url", "http://localhost:8000"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="ignore"
        )
        for line in proc.stdout:
            match = re.search(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", line)
            if match:
                public_url = match.group(0)
                print("\n" + "=" * 68)
                print("  LINK MOBILEGIS PUBLIC (MO TREN DIEN THOAI / THIET BI KHAC):")
                print(f"  >>> {public_url} <<<")
                print("=" * 68)
                try:
                    subprocess.run(["clip"], input=public_url.encode("utf-8"), check=False)
                    print("  (Da tu dong copy link vao Clipboard - bam Ctrl+V de gui ngay!)\n")
                except Exception:
                    pass
    except FileNotFoundError:
        print("[Canh bao] Chua tim thay lenh 'cloudflared'. Hay khoi dong lai VS Code sau khi cai.")
    except Exception as e:
        print(f"[Canh bao] Khong the tao Cloudflare Tunnel: {e}")


def main():
    print("===========================================================")
    print("   DANG KHOI DONG HE THONG WEBGIS & MOBILEGIS TP.HCM")
    print("===========================================================")

    os.chdir(BASE_DIR)
    had_dist_before = os.path.exists(DIST_DIR)

    # 0. Tự động build bản giao diện React mới nhất (npm.cmd run build)
    print("[0/3] Dang dong goi giao dien WebGIS & MobileGIS moi nhat...")
    subprocess.run(["npm.cmd", "run", "build"], check=False)

    if not had_dist_before and os.path.exists(DIST_DIR):
        mount_frontend_routes()

    # 1. Chạy ngầm Cloudflare Tunnel để lấy link HTTPS cho điện thoại
    print("[1/3] Dang tao duong link truy cap tu xa (Cloudflare Tunnel)...")
    tunnel_thread = threading.Thread(target=start_cloudflare_tunnel, daemon=True)
    tunnel_thread.start()

    # 2. Mở giao diện trên máy tính sau 1.5 giây
    def open_browser():
        time.sleep(1.5)
        webbrowser.open("http://localhost:8000")

    threading.Thread(target=open_browser, daemon=True).start()

    # 3. Khởi động máy chủ FastAPI phục vụ cả API lẫn Frontend
    print("[2/3] Dang khoi dong may chu WebGIS tai http://localhost:8000 ...")
    print("[3/3] Nhan Ctrl + C trong Terminal de tat toan bo he thong.\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()