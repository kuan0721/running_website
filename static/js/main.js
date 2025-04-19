// 登入/註冊頁面的標籤切換功能
function showTab(tabId) {
    // 隱藏所有標籤內容
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active', 'animate__animated', 'animate__fadeIn');
        tab.classList.add('d-none');
    });
    
    // 取消所有標籤按鈕的活躍狀態
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 顯示選定的標籤內容
    const activeTab = document.getElementById(tabId);
    activeTab.classList.remove('d-none');
    activeTab.classList.add('active', 'animate__animated', 'animate__fadeIn');
    
    // 設置相應的標籤按鈕為活躍狀態
    document.querySelector(`.tab-btn[onclick="showTab('${tabId}')"]`).classList.add('active');
  }
  
  // 位置追蹤功能
  document.addEventListener('DOMContentLoaded', function() {
    const startTrackingBtn = document.getElementById('start-tracking');
    const stopTrackingBtn = document.getElementById('stop-tracking');
    const trackingStatus = document.getElementById('tracking-status');
    const distanceValue = document.getElementById('distance-value');
    const timeValue = document.getElementById('time-value');
    const activityTypeSelect = document.getElementById('activity-type');
    
    let watchId = null;
    let startTime = null;
    let previousPosition = null;
    let totalDistance = 0;
    let timer = null;
    
    // 確認頁面中是否有追蹤元素
    if (startTrackingBtn && stopTrackingBtn) {
        // 開始追蹤按鈕事件
        startTrackingBtn.addEventListener('click', function() {
            const activityType = activityTypeSelect.value;
            if (!activityType) {
                alert('請選擇出行方式');
                return;
            }
            
            // 檢查是否支援地理位置
            if (!navigator.geolocation) {
                alert('您的瀏覽器不支援地理位置功能');
                return;
            }
            
            // 開始追蹤
            startTracking();
        });
        
        // 停止追蹤按鈕事件
        stopTrackingBtn.addEventListener('click', function() {
            stopTracking();
        });
    }
    
    // 開始追蹤函數
    function startTracking() {
        // 重置數據
        totalDistance = 0;
        previousPosition = null;
        startTime = new Date();
        
        // 更新UI
        startTrackingBtn.disabled = true;
        stopTrackingBtn.disabled = false;
        trackingStatus.classList.remove('hidden');
        distanceValue.textContent = '0.00';
        timeValue.textContent = '00:00:00';
        
        // 開始計時器
        timer = setInterval(updateTimer, 1000);
        
        // 開始地理位置追蹤
        watchId = navigator.geolocation.watchPosition(
            handlePositionUpdate,
            handlePositionError,
            { 
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }
    
    // 停止追蹤函數
    function stopTracking() {
        if (watchId !== null) {
            // 停止地理位置追蹤
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
            
            // 停止計時器
            clearInterval(timer);
            
            // 更新UI
            startTrackingBtn.disabled = false;
            stopTrackingBtn.disabled = true;
            
            // 記錄活動
            recordActivity();
        }
    }
    
    // 處理位置更新
    function handlePositionUpdate(position) {
        const currentPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        
        // 如果有前一個位置，計算距離
        if (previousPosition) {
            const segmentDistance = calculateDistance(
                previousPosition.lat, previousPosition.lng,
                currentPosition.lat, currentPosition.lng
            );
            
            // 如果移動距離合理 (> 2米，防止GPS跳動)
            if (segmentDistance > 0.002) {
                totalDistance += segmentDistance;
                distanceValue.textContent = totalDistance.toFixed(2);
                
                // 更新進度條
                updateProgressBar(Math.min(100, (totalDistance / 5) * 100));
            }
        }
        
        // 更新前一個位置
        previousPosition = currentPosition;
    }
    
    // 處理位置錯誤
    function handlePositionError(error) {
        console.error('位置追蹤錯誤:', error);
        switch(error.code) {
            case error.PERMISSION_DENIED:
                alert('用戶拒絕了地理位置請求');
                break;
            case error.POSITION_UNAVAILABLE:
                alert('位置信息不可用');
                break;
            case error.TIMEOUT:
                alert('獲取用戶位置超時');
                break;
            case error.UNKNOWN_ERROR:
                alert('發生未知錯誤');
                break;
        }
        stopTracking();
    }
    
    // 計算兩點之間的距離 (單位: 公里)
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // 地球半徑 (公里)
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        const distance = R * c; // 距離 (公里)
        return distance;
    }
    
    // 角度轉弧度
    function deg2rad(deg) {
        return deg * (Math.PI/180);
    }
    
    // 更新計時器顯示
    function updateTimer() {
        if (startTime) {
            const currentTime = new Date();
            const elapsedTime = new Date(currentTime - startTime);
            const hours = String(elapsedTime.getUTCHours()).padStart(2, '0');
            const minutes = String(elapsedTime.getUTCMinutes()).padStart(2, '0');
            const seconds = String(elapsedTime.getUTCSeconds()).padStart(2, '0');
            timeValue.textContent = `${hours}:${minutes}:${seconds}`;
            
            // 更新進度條 - 使用 30 分鐘作為最大時間
            const maxMinutes = 30;
            const elapsedMinutes = elapsedTime.getUTCHours() * 60 + elapsedTime.getUTCMinutes();
            const progressPercentage = Math.min(100, (elapsedMinutes / maxMinutes) * 100);
            updateProgressBar(progressPercentage);
        }
    }
    
    // 記錄活動到伺服器
    function recordActivity() {
        const activityType = activityTypeSelect.value;
        const distance = parseFloat(distanceValue.textContent);
        
        if (distance < 0.1) {
            alert('記錄的距離太短，請至少移動0.1公里');
            return;
        }
        
        const formData = new FormData();
        formData.append('activity_type', activityType);
        formData.append('distance', distance);
        
        fetch('/record_activity', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            const resultMessage = document.getElementById('result-message');
            if (data.success) {
                resultMessage.textContent = `恭喜！您獲得了 ${data.tokens_earned} 個綠色代幣！總計：${data.total_tokens}`;
                resultMessage.className = 'success animate__animated animate__bounceIn';
                
                // 更新代幣顯示並添加動畫
                animateTokenCount(data.total_tokens);
                
                // 顯示代幣雨動畫
                if (data.tokens_earned > 0) {
                    createTokenRain();
                    document.querySelector('.token-badge').classList.add('celebrating');
                    setTimeout(() => {
                        document.querySelector('.token-badge').classList.remove('celebrating');
                    }, 1000);
                }
                
                // 更新碳排放減少數值
                document.querySelector('.impact-number').textContent = Math.floor(data.total_tokens / 2);
                
                // 更新電子樹
                updateTreeAfterActivity(data.total_tokens);
                
                // 2秒後刷新頁面
                setTimeout(() => {
                    location.reload();
                }, 3000);
            } else {
                resultMessage.textContent = data.message || '記錄失敗，請稍後再試！';
                resultMessage.className = 'error animate__animated animate__shakeX';
            }
            
            resultMessage.classList.remove('hidden');
            
            // 5秒後隱藏訊息
            setTimeout(() => {
                resultMessage.classList.add('hidden');
            }, 5000);
        })
        .catch(error => {
            console.error('Error:', error);
            const resultMessage = document.getElementById('result-message');
            resultMessage.textContent = '發生錯誤，請稍後再試！';
            resultMessage.className = 'error animate__animated animate__shakeX';
            resultMessage.classList.remove('hidden');
        });
    }
  
    // Token 計數器動畫
    function animateTokenCount(finalValue) {
        const tokenCountElement = document.querySelector('.token-count');
        if (!tokenCountElement) return;
        
        const duration = 1000; // ms
        const frameDuration = 1000/60; // 60fps
        const totalFrames = Math.round(duration/frameDuration);
        
        let startValue = parseInt(tokenCountElement.textContent);
        const increment = (finalValue - startValue) / totalFrames;
        
        let currentFrame = 0;
        
        const counter = setInterval(() => {
            currentFrame++;
            const currentValue = Math.round(startValue + increment * currentFrame);
            tokenCountElement.textContent = currentValue;
            
            if (currentFrame === totalFrames) {
                clearInterval(counter);
                tokenCountElement.textContent = finalValue;
            }
        }, frameDuration);
    }
  
    // 進度條動畫
    function updateProgressBar(percentage) {
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    }
  
    // 代幣雨動畫
    function createTokenRain() {
        const tokenRain = document.createElement('div');
        tokenRain.className = 'token-rain';
        document.body.appendChild(tokenRain);
        
        const tokenCount = 50;
        
        for (let i = 0; i < tokenCount; i++) {
            const token = document.createElement('div');
            token.className = 'token';
            token.style.left = `${Math.random() * 100}%`;
            token.style.animationDuration = `${Math.random() * 2 + 1}s`;
            token.style.animationDelay = `${Math.random() * 0.5}s`;
            tokenRain.appendChild(token);
        }
        
        setTimeout(() => {
            tokenRain.remove();
        }, 3000);
    }
    
    // 電子樹功能
    const treeContainer = document.querySelector('.tree-visual');
    if (treeContainer) {
        initTree();
    }
    
    function initTree() {
        // 從碳減排量計算總公里數 (impact number 是 tokens/2，而每公里約產生 2 tokens)
        const carbonSaved = parseFloat(document.querySelector('.impact-number').textContent || 0);
        const totalKm = carbonSaved * 2; // 估算總公里數
        updateTree(totalKm);
    }
    
    function updateTree(totalKm) {
        // 確定樹的容器存在
        const treeContainer = document.querySelector('.tree-visual');
        if (!treeContainer) return;
        
        // 定義樹的等級閾值 (公里)
        const levels = [
            { threshold: 0, name: '幼苗' },
            { threshold: 5, name: '小樹' },
            { threshold: 15, name: '成長中' },
            { threshold: 30, name: '茁壯' },
            { threshold: 50, name: '大樹' }
        ];
        
        // 確定當前等級
        let currentLevel = 0;
        for (let i = 0; i < levels.length; i++) {
            if (totalKm >= levels[i].threshold) {
                currentLevel = i;
            } else {
                break;
            }
        }
        
        // 移除所有等級類
        treeContainer.className = 'tree-visual';
        
        // 添加當前等級類
        treeContainer.classList.add(`tree-level-${currentLevel + 1}`);
        
        // 更新等級顯示
        const treeLevelElement = document.getElementById('tree-level');
        if (treeLevelElement) {
            treeLevelElement.textContent = `第 ${currentLevel + 1} 級: ${levels[currentLevel].name}`;
        }
        
        // 計算距離下一級所需的公里數
        const nextLevelKmElement = document.getElementById('next-level-km');
        const treeProgressBar = document.getElementById('tree-progress-bar');
        const progressTextElement = document.querySelector('.progress-text');
        
        if (nextLevelKmElement && treeProgressBar && progressTextElement) {
            if (currentLevel < levels.length - 1) {
                const nextLevelKm = (levels[currentLevel + 1].threshold - totalKm).toFixed(1);
                nextLevelKmElement.textContent = nextLevelKm;
                
                // 更新進度條
                const progressPercentage = ((totalKm - levels[currentLevel].threshold) / 
                                            (levels[currentLevel + 1].threshold - levels[currentLevel].threshold)) * 100;
                treeProgressBar.style.width = `${progressPercentage}%`;
            } else {
                // 已達最高等級
                nextLevelKmElement.textContent = '0';
                treeProgressBar.style.width = '100%';
                progressTextElement.textContent = '恭喜！您已達到最高等級';
            }
        }
    }
  
    // 在記錄活動成功後更新樹
    function updateTreeAfterActivity(totalTokens) {
        // 從 tokens 估算總公里數
        const totalKm = (totalTokens / 2); // 每公里約產生 2 tokens
        
        const treeVisual = document.querySelector('.tree-visual');
        if (!treeVisual) return;
        
        // 添加成長動畫
        treeVisual.classList.add('tree-growing');
        setTimeout(() => {
            treeVisual.classList.remove('tree-growing');
        }, 1000);
        
        // 如果樹升級，添加葉子飄落動畫
        createLeafFallEffect();
        
        // 更新樹的大小和等級
        updateTree(totalKm);
    }
  
    // 葉子飄落效果
    function createLeafFallEffect() {
        const treeCanopy = document.getElementById('tree-canopy');
        const treeVisual = document.querySelector('.tree-visual');
        if (!treeCanopy || !treeVisual) return;
        
        for (let i = 0; i < 15; i++) {
            const leaf = document.createElement('div');
            leaf.className = 'leaf';
            
            // 設置隨機起始位置 (相對於樹冠)
            const startX = Math.random() * treeCanopy.offsetWidth - treeCanopy.offsetWidth/2;
            const startY = Math.random() * treeCanopy.offsetHeight/2 + treeCanopy.offsetHeight/2;
            
            // 設置隨機結束位置
            const endX = startX + (Math.random() * 160 - 80);
            leaf.style.setProperty('--end-x', `${endX}px`);
            
            // 設置隨機動畫時間
            const animDuration = Math.random() * 2 + 2;
            leaf.style.animationDuration = `${animDuration}s`;
            
            // 設置葉子位置
            leaf.style.left = `${startX + treeCanopy.offsetWidth/2}px`;
            leaf.style.top = `${startY}px`;
            
            // 添加到樹視覺容器
            treeVisual.appendChild(leaf);
            
            // 動畫結束後移除葉子
            setTimeout(() => {
                if (leaf.parentNode) {
                    leaf.parentNode.removeChild(leaf);
                }
            }, animDuration * 1000);
        }
    }
  });

document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            console.log('登出按鈕被點擊');
            // 如果需要使用AJAX登出，可以在這裡添加代碼
            // 或者讓默認的連結行為繼續執行
        });
    }
});

let map, control = null;

document.addEventListener("DOMContentLoaded", function () {
  // 1. 地圖初始化
  const mapElement = document.getElementById("map");
  if (!mapElement) return; // 若沒有地圖區塊就跳過

  map = L.map("map").setView([23.5, 121], 7);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }).addTo(map);

  // 2. 路線規劃
  document.getElementById("planRoute").addEventListener("click", async () => {
    const start = document.getElementById("start").value;
    const end   = document.getElementById("end").value;

    const getCoords = async (place) => {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`
      );
      const data = await res.json();
      if (!data.length) throw new Error(`找不到地點：${place}`);
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    };

    try {
      const [startCoord, endCoord] = await Promise.all([
        getCoords(start),
        getCoords(end)
      ]);

      if (control) map.removeControl(control);

      control = L.Routing.control({
        waypoints: [
          L.latLng(startCoord[0], startCoord[1]),
          L.latLng(endCoord[0], endCoord[1])
        ],
        routeWhileDragging: false,
        show: false,  // 關閉預設指示面板
        formatter: new L.Routing.Formatter(L.Routing.Localization['zh-TW'])
      }).addTo(map);

    } catch (err) {
      alert("規劃路線錯誤：" + err.message);
    }
  });

  // 3. 追蹤元素綁定
  const startTrackingBtn   = document.getElementById("start-tracking");
  const stopTrackingBtn    = document.getElementById("stop-tracking");
  const trackingStatus     = document.getElementById("tracking-status");
  const distanceValue      = document.getElementById("distance-value");
  const timeValue          = document.getElementById("time-value");
  const activityTypeSelect = document.getElementById("activity-type");

  let watchId       = null;
  let startTime     = null;
  let previousPos   = null;
  let totalDistance = 0;
  let timer         = null;

  // 開始記錄
  startTrackingBtn.addEventListener("click", function () {
    const activityType = activityTypeSelect.value;
    if (!activityType) {
      alert("請先選擇出行方式");
      return;
    }
    if (!navigator.geolocation) {
      alert("此瀏覽器不支援地理位置功能");
      return;
    }

    // —— 新增：如果已經有規劃好的路線，就放大到該路線範圍 —— 
    if (control && control._routes && control._routes[0]) {
      const coords = control._routes[0].coordinates;
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // 呼叫原本的 startTracking
    startTrackingBtn.disabled = true;
    stopTrackingBtn.disabled  = false;
    trackingStatus.classList.remove("hidden");
    distanceValue.textContent = "0.00";
    timeValue.textContent     = "00:00:00";
    totalDistance = 0;
    previousPos   = null;
    startTime     = new Date();

    timer = setInterval(updateTimer, 1000);
    watchId = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });

  // 停止記錄
  stopTrackingBtn.addEventListener("click", function () {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(timer);
      startTrackingBtn.disabled = false;
      stopTrackingBtn.disabled  = true;
      recordActivity();
    }
  });

  // 處理位置更新
  function handlePositionUpdate(position) {
    const curr = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };

    if (previousPos) {
      const segment = calculateDistance(
        previousPos.lat, previousPos.lng,
        curr.lat, curr.lng
      );
      if (segment > 0.002) {
        totalDistance += segment;
        distanceValue.textContent = totalDistance.toFixed(2);
      }
    }
    previousPos = curr;
  }

  // 位置錯誤處理
  function handlePositionError(err) {
    console.error("位置追蹤錯誤：", err);
    alert("無法取得位置：請確認授權或網路狀態");
    navigator.geolocation.clearWatch(watchId);
    clearInterval(timer);
    startTrackingBtn.disabled = false;
    stopTrackingBtn.disabled  = true;
  }

  // 計算兩點距離（公里）
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI/180;
    const dLon = (lon2 - lon1) * Math.PI/180;
    const a = Math.sin(dLat/2)**2
            + Math.cos(lat1 * Math.PI/180)
            * Math.cos(lat2 * Math.PI/180)
            * Math.sin(dLon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // 計時器更新
  function updateTimer() {
    const now = new Date();
    const elapsed = new Date(now - startTime);
    const hh = String(elapsed.getUTCHours()).padStart(2, "0");
    const mm = String(elapsed.getUTCMinutes()).padStart(2, "0");
    const ss = String(elapsed.getUTCSeconds()).padStart(2, "0");
    timeValue.textContent = `${hh}:${mm}:${ss}`;
  }

  // 發送到後端記錄
  function recordActivity() {
    const activityType = activityTypeSelect.value;
    const distance = parseFloat(distanceValue.textContent);

    if (distance < 0.1) {
      alert("記錄距離太短，至少 0.1 公里");
      return;
    }

    const formData = new FormData();
    formData.append("activity_type", activityType);
    formData.append("distance", distance);

    fetch("/record_activity", {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert(`完成！獲得 ${data.tokens_earned} 代幣，總計 ${data.total_tokens}`);
          location.reload();
        } else {
          alert(data.message || "記錄失敗");
        }
      })
      .catch(() => alert("伺服器錯誤，請稍後再試"));
  }
});

// 4. 路徑指令本地化（不需改動）
L.Routing.Localization = L.Routing.Localization || {};
L.Routing.Localization["zh-TW"] = {
  directions: {
    north: "北", northeast: "東北", east: "東", southeast: "東南",
    south: "南", southwest: "西南", west: "西", northwest: "西北"
  },
  instructions: {
    straight: ["繼續直走", false],
    slight_right: ["稍微向右走", false],
    right: ["右轉", false],
    sharp_right: ["大右轉", false],
    turn_around: ["回轉", false],
    sharp_left: ["大左轉", false],
    left: ["左轉", false],
    slight_left: ["稍微向左走", false],
    depart: ["從 %s 出發", false],
    arrive: ["到達 %s", false],
    merge: ["往 %s 匯入", false],
    "on ramp": ["走匝道 %s", false],
    "off ramp": ["從匝道離開 %s", false],
    fork: ["在岔路選擇 %s", false],
    "end of road": ["在路的盡頭向 %s", false],
    continue: ["在 %s 繼續直行", false],
    roundabout: ["在圓環走 %s 個出口，往 %s", true],
    rotary: ["在圓環走 %s 個出口，往 %s", true],
    "roundabout turn": ["離開圓環，往 %s", false],
    notification: ["注意 %s", false],
    "exit roundabout": ["離開圓環", false],
    "exit rotary": ["離開圓環", false]
  }
};
  