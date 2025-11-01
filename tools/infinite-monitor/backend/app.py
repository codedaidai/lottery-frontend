#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
无限赏监控系统 - 后端API服务
实时追踪每个盒子的库存状况、奖品剩余数量
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import pymysql
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 加载数据库配置
CONFIG_PATH = os.path.join(os.path.dirname(__file__), '../config/database.json')

def get_db_config():
    """读取数据库配置"""
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"配置文件读取失败: {e}")
        return None

def get_db_connection():
    """创建数据库连接"""
    config = get_db_config()
    if not config:
        return None

    try:
        connection = pymysql.connect(
            host=config['host'],
            port=config['port'],
            user=config['user'],
            password=config['password'],
            database=config['database'],
            charset=config['charset'],
            cursorclass=pymysql.cursors.DictCursor
        )
        return connection
    except Exception as e:
        print(f"数据库连接失败: {e}")
        return None

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    conn = get_db_connection()
    if conn:
        conn.close()
        return jsonify({"status": "ok", "message": "数据库连接正常"})
    else:
        return jsonify({"status": "error", "message": "数据库连接失败"}), 500

@app.route('/api/infinite/boxes', methods=['GET'])
def get_infinite_boxes():
    """获取所有无限赏盒子列表"""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "数据库连接失败"}), 500

    try:
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    gi.id,
                    gi.title,
                    gi.imgurl,
                    gi.price,
                    gi.sale_num,
                    gi.sort,
                    gi.status,
                    gi.addtime,
                    COUNT(gil.id) as prize_count,
                    SUM(gil.real_pro_stock) as total_stock,
                    SUM(gil.sale_num) as total_prize_sale
                FROM goods_infinite gi
                LEFT JOIN goods_infinite_list gil ON gi.id = gil.goods_id AND gil.status = 1
                WHERE gi.status IN (1, 2)
                GROUP BY gi.id
                ORDER BY gi.sort DESC, gi.id DESC
            """
            cursor.execute(sql)
            boxes = cursor.fetchall()

            # 处理数据
            for box in boxes:
                box['status_text'] = '上架' if box['status'] == 1 else '下架'
                box['addtime_text'] = datetime.fromtimestamp(box['addtime']).strftime('%Y-%m-%d %H:%M')
                box['total_stock'] = int(box['total_stock'] or 0)
                box['total_prize_sale'] = int(box['total_prize_sale'] or 0)

                # 计算库存百分比
                if box['total_stock'] > 0:
                    box['stock_percent'] = round(box['total_stock'] / 10000 * 100, 2)
                else:
                    box['stock_percent'] = 0

                # 判断是否即将刷新 (库存 <= 50)
                box['need_refresh'] = box['total_stock'] <= 50

            return jsonify({
                "success": True,
                "data": boxes,
                "count": len(boxes),
                "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/infinite/box/<int:box_id>', methods=['GET'])
def get_box_detail(box_id):
    """获取指定盒子的详细信息"""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "数据库连接失败"}), 500

    try:
        with conn.cursor() as cursor:
            # 获取盒子基本信息
            cursor.execute("""
                SELECT * FROM goods_infinite WHERE id = %s
            """, (box_id,))
            box = cursor.fetchone()

            if not box:
                return jsonify({"error": "盒子不存在"}), 404

            # 获取奖品列表
            cursor.execute("""
                SELECT
                    gil.id,
                    gil.title,
                    gil.imgurl,
                    gil.price,
                    gil.money as recycle_price,
                    gil.gailv1 as display_prob,
                    gil.gailv2 as real_prob,
                    gil.real_pro_stock,
                    gil.sale_num,
                    gil.shang_id,
                    gil.unique_id,
                    s.title as shang_title,
                    s.color as shang_color
                FROM goods_infinite_list gil
                LEFT JOIN shang s ON gil.shang_id = s.id
                WHERE gil.goods_id = %s AND gil.status = 1
                ORDER BY gil.money DESC, gil.id ASC
            """, (box_id,))
            prizes = cursor.fetchall()

            # 计算统计数据
            total_stock = sum(p['real_pro_stock'] for p in prizes)
            total_sales = sum(p['sale_num'] for p in prizes)

            # 分赏品等级统计
            shang_stats = {}
            for prize in prizes:
                shang_id = prize['shang_id']
                if shang_id not in shang_stats:
                    shang_stats[shang_id] = {
                        'shang_title': prize['shang_title'],
                        'shang_color': prize['shang_color'],
                        'count': 0,
                        'stock': 0,
                        'sales': 0
                    }
                shang_stats[shang_id]['count'] += 1
                shang_stats[shang_id]['stock'] += prize['real_pro_stock']
                shang_stats[shang_id]['sales'] += prize['sale_num']

            box['addtime_text'] = datetime.fromtimestamp(box['addtime']).strftime('%Y-%m-%d %H:%M')

            return jsonify({
                "success": True,
                "box": box,
                "prizes": prizes,
                "stats": {
                    "total_stock": total_stock,
                    "total_sales": total_sales,
                    "prize_count": len(prizes),
                    "stock_percent": round(total_stock / 10000 * 100, 2),
                    "need_refresh": total_stock <= 50,
                    "shang_stats": shang_stats
                },
                "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/infinite/prizes/low-stock', methods=['GET'])
def get_low_stock_prizes():
    """获取库存告急的奖品 (real_pro_stock < 10)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "数据库连接失败"}), 500

    try:
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    gil.id,
                    gil.goods_id,
                    gi.title as box_title,
                    gil.title as prize_title,
                    gil.real_pro_stock,
                    gil.gailv2,
                    gil.price,
                    gil.money,
                    s.title as shang_title,
                    s.color as shang_color
                FROM goods_infinite_list gil
                LEFT JOIN goods_infinite gi ON gil.goods_id = gi.id
                LEFT JOIN shang s ON gil.shang_id = s.id
                WHERE gil.status = 1
                  AND gil.real_pro_stock < 10
                  AND gi.status = 1
                ORDER BY gil.real_pro_stock ASC, gil.money DESC
            """
            cursor.execute(sql)
            low_stock_prizes = cursor.fetchall()

            return jsonify({
                "success": True,
                "data": low_stock_prizes,
                "count": len(low_stock_prizes),
                "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/infinite/boxes/need-refresh', methods=['GET'])
def get_boxes_need_refresh():
    """获取需要刷新的盒子 (总库存 <= 50)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "数据库连接失败"}), 500

    try:
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    gi.id,
                    gi.title,
                    gi.price,
                    gi.sale_num,
                    SUM(gil.real_pro_stock) as total_stock,
                    COUNT(gil.id) as prize_count
                FROM goods_infinite gi
                LEFT JOIN goods_infinite_list gil ON gi.id = gil.goods_id AND gil.status = 1
                WHERE gi.status = 1
                GROUP BY gi.id
                HAVING total_stock <= 50
                ORDER BY total_stock ASC
            """
            cursor.execute(sql)
            boxes = cursor.fetchall()

            return jsonify({
                "success": True,
                "data": boxes,
                "count": len(boxes),
                "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/infinite/stats', methods=['GET'])
def get_global_stats():
    """获取全局统计数据"""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "数据库连接失败"}), 500

    try:
        with conn.cursor() as cursor:
            # 盒子总数
            cursor.execute("SELECT COUNT(*) as count FROM goods_infinite WHERE status = 1")
            box_count = cursor.fetchone()['count']

            # 总销售数量
            cursor.execute("SELECT SUM(sale_num) as total FROM goods_infinite WHERE status = 1")
            total_sales = cursor.fetchone()['total'] or 0

            # 总库存
            cursor.execute("""
                SELECT SUM(gil.real_pro_stock) as total
                FROM goods_infinite_list gil
                LEFT JOIN goods_infinite gi ON gil.goods_id = gi.id
                WHERE gil.status = 1 AND gi.status = 1
            """)
            total_stock = cursor.fetchone()['total'] or 0

            # 需要刷新的盒子数量
            cursor.execute("""
                SELECT COUNT(DISTINCT gi.id) as count
                FROM goods_infinite gi
                LEFT JOIN goods_infinite_list gil ON gi.id = gil.goods_id AND gil.status = 1
                WHERE gi.status = 1
                GROUP BY gi.id
                HAVING SUM(gil.real_pro_stock) <= 50
            """)
            refresh_count = cursor.fetchone()['count'] if cursor.rowcount > 0 else 0

            return jsonify({
                "success": True,
                "stats": {
                    "box_count": box_count,
                    "total_sales": int(total_sales),
                    "total_stock": int(total_stock),
                    "refresh_count": refresh_count,
                    "avg_stock_per_box": round(total_stock / box_count, 2) if box_count > 0 else 0
                },
                "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    print("=" * 60)
    print("🎯 无限赏监控系统启动中...")
    print("=" * 60)
    print("📡 API服务地址: http://localhost:5000")
    print("📊 监控面板地址: http://localhost:5000/static/index.html")
    print("=" * 60)

    # 测试数据库连接
    conn = get_db_connection()
    if conn:
        print("✅ 数据库连接成功")
        conn.close()
    else:
        print("❌ 数据库连接失败，请检查配置文件")

    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=True)
