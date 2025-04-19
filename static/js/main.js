// 登入/註冊頁面的標籤切換功能
function showTab(tabId) {
  // 隱藏所有標籤內容
  document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
  });
  
  // 取消所有標籤按鈕的活躍狀態
  document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
  });
  
  // 顯示選定的標籤內容
  document.getElementById(tabId).classList.add('active');
  
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
              resultMessage.className = 'success';
              
              // 更新代幣顯示
              document.querySelector('.token-count').textContent = data.total_tokens;
              document.querySelector('.impact-number').textContent = Math.floor(data.total_tokens / 2);
              
              // 2秒後刷新頁面
              setTimeout(() => {
                  location.reload();
              }, 2000);
          } else {
              resultMessage.textContent = data.message || '記錄失敗，請稍後再試！';
              resultMessage.className = 'error';
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
          resultMessage.className = 'error';
          resultMessage.classList.remove('hidden');
      });
  }
});