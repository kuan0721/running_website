from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
import os
import json
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'greentokensecretkey'

# 模擬資料庫
USERS_FILE = 'users.json'

def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f)

# 初始化或載入使用者資料
users = load_users()

@app.route('/')
def home():
    if 'username' in session:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    
    if username in users and users[username]['password'] == password:
        session['username'] = username
        return redirect(url_for('dashboard'))
    
    flash('登入資訊不正確')
    return redirect(url_for('home'))

@app.route('/register', methods=['POST'])
def register():
    username = request.form['username']
    password = request.form['password']
    
    if username in users:
        flash('使用者名稱已存在')
        return redirect(url_for('home'))
    
    users[username] = {
        'password': password,
        'tokens': 0,
        'history': []
    }
    save_users(users)
    
    session['username'] = username
    return redirect(url_for('dashboard'))

@app.route('/dashboard')
def dashboard():
    if 'username' not in session:
        return redirect(url_for('home'))
    
    user = users[session['username']]
    return render_template('dashboard.html', tokens=user['tokens'], history=user['history'])

@app.route('/record_activity', methods=['POST'])
def record_activity():
    if 'username' not in session:
        return jsonify({'success': False, 'message': '請先登入'})
    
    activity_type = request.form['activity_type']
    distance = float(request.form['distance'])
    
    if distance < 0.1:
        return jsonify({'success': False, 'message': '記錄的距離太短，至少需要0.1公里'})
    
    # 計算代幣獎勵
    tokens_earned = 0
    if activity_type == 'walking':
        tokens_earned = int(distance * 2)  # 每公里走路得2個代幣
    elif activity_type == 'public_transport':
        tokens_earned = int(distance * 1)  # 每公里大眾運輸得1個代幣
    
    # 更新使用者資料
    username = session['username']
    users[username]['tokens'] += tokens_earned
    users[username]['history'].append({
        'date': datetime.now().strftime('%Y-%m-%d %H:%M'),
        'activity': '走路' if activity_type == 'walking' else '大眾運輸',
        'distance': distance,
        'tokens': tokens_earned
    })
    save_users(users)
    
    return jsonify({
        'success': True, 
        'tokens_earned': tokens_earned,
        'total_tokens': users[username]['tokens']
    })

@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('home'))

if __name__ == '__main__':
    # 移除 ngrok，直接讓 Flask 綁定所有介面
    app.run(host='0.0.0.0', port=5000)
