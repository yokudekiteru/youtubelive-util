// ==UserScript==
// @name         YouTubeLiveユーティリティ
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  YouTubeStudioでのライブ配信を補助するツール
// @author       You
// @match        https://studio.youtube.com/video/*/livestreaming*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

/**
 * 画面を開きっぱなしにしておくことで、時間差で画面操作をおこなうツールです
 * [できること]
 * - 定期的に広告挿入ボタンをクリックする
 * - 配信開始と終了の予約を可能とする
 */

(function() {
  'use strict';

  const insertAdButtonId = 'insert-ad-button';
  let insertAdNextTimeoutId = null;
  const insertAdBaseDatetimeId = 'ytlutil-insert-ad-base-datetime';
  const insertAdSwitchId = 'ytlutil-insert-ad-switch';
  const insertAdExecMonitorId = 'ytlutil-insert-ad-exec-monitor';
  const insertAdLastExecDatetimeId = 'ytlutil-insert-ad-last-exec-datetime';
  const insertAdNextExecDatetimeId = 'ytlutil-insert-ad-next-exec-datetime';
  const insertAdIntervalMinutesId = 'ytlutil-interval-minutes';

  const startStreamButtonId = 'start-stream-button';
  let startStreamTimeoutId = null;
  const endStreamButtonId = 'end-stream-button';
  let endStreamTimeoutId = null;
  const startStreamReserveButtonId = 'start-stream-reserve-button';
  const endStreamReserveButtonId = 'end-stream-reserve-button';
  const streamTimerMonitorId = 'ytlutil-stream-timer-monitor';
  const startStreamDateId = 'ytlutil-start-stream-date';
  const startStreamTimeId = 'ytlutil-start-stream-time';
  const endStreamDateId = 'ytlutil-end-stream-date';
  const endStreamTimeId = 'ytlutil-end-stream-time';

  const insertMidRollAd = function() {
    let insertAdButton = document.getElementById(insertAdButtonId);
    if (insertAdButton !== null && !insertAdButton.hidden) {
      console.log('処理実行');
      insertAdButton.click();
      document.getElementById(insertAdLastExecDatetimeId).innerText = new Date().toLocaleString();
      document.getElementById(insertAdSwitchId).disabled = 'disabled';
      scheduleNextInsertAd();
    } else {
      // 自動挿入を強制オフにする
      document.getElementById(insertAdSwitchId).value = 'off';
      scheduleNextInsertAd();
    }
  }

  const scheduleNextInsertAd = function() {

    const myFlag = document.getElementById(insertAdSwitchId).value !== '-1';

    let now = new Date();
    let baseDatetimeString = document.getElementById(insertAdBaseDatetimeId).innerText;
    if (baseDatetimeString === '--') {
      return;
    }

    let baseDatetime = new Date(baseDatetimeString);
    let mySwitch = document.getElementById(insertAdSwitchId).value;

    mySwitch = 1 * mySwitch * 60 * 1000;
    let myInterval = (1 * document.getElementById(insertAdIntervalMinutesId).value) * 60 * 1000;
    let firstExecDatetime = new Date(baseDatetime.getTime() + mySwitch);
    console.log(firstExecDatetime.toLocaleString());
    let lastExecDatetime = document.getElementById(insertAdLastExecDatetimeId).innerText;
    let nextExecDatetime = new Date(now.getTime() + myInterval);
    if (lastExecDatetime === '未実行' && mySwitch !== 0 && firstExecDatetime > now) {
      nextExecDatetime = firstExecDatetime;
    }

    // 次回実行をキャンセル
    if (insertAdNextTimeoutId !== null) {
      console.log('次回実行をキャンセル: ' + insertAdNextTimeoutId);
      clearTimeout(insertAdNextTimeoutId);
    }

    if (myFlag) {
      // 次回実行予定を記入
      document.getElementById(insertAdNextExecDatetimeId).innerText = nextExecDatetime.toLocaleString();
      // 次回実行を登録
      insertAdNextTimeoutId = setTimeout(insertMidRollAd, nextExecDatetime.getTime() - now.getTime());
      console.log('次回実行: ' + insertAdNextTimeoutId);
    } else {
      // 次回実行予定を記入
      document.getElementById(insertAdNextExecDatetimeId).innerText = ' - ';
    }
  }

  const scheduleStream = function(startEnd, dateId, timeId, reserveButtonId, clickButtonId, callback) {
    const scheduleDate = document.getElementById(dateId);
    const scheduleTime = document.getElementById(timeId);
    if (!scheduleDate.value || !scheduleTime.value) {
      alert(startEnd + '「日付・時刻」を必ず入力してください');
      return;
    }

    let schedule = new Date(scheduleDate.value + ' ' + scheduleTime.value + ':00');
    console.log(startEnd + '日時: ' + schedule.toLocaleString());
    let justNow = new Date();
    if (schedule <= justNow) {
      alert(startEnd + '日時が過去です');
      return;
    }
    let delay = schedule.getTime() - justNow.getTime();
    document.getElementById(reserveButtonId).innerText = '変更';
    return setTimeout(function() {
      document.getElementById(clickButtonId).click();
      if (typeof callback === 'function') {
        callback();
      }
    }, delay);
  }

  const scheduleStartStream = function() {
    let newTimeoutId = scheduleStream(
      '開始', startStreamDateId, startStreamTimeId, startStreamReserveButtonId, startStreamButtonId,
      function() {
        // 広告自動挿入の基準日時を設定し、広告自動挿入を起動
        document.getElementById(insertAdBaseDatetimeId).innerText = new Date().toLocaleString();
        scheduleNextInsertAd();
      }
    );
    if (startStreamTimeoutId !== null) {
      clearTimeout(startStreamTimeoutId);
    }
    startStreamTimeoutId = newTimeoutId;
  }

  const scheduleEndStream = function() {
    let newTimeoutId = scheduleStream(
      '終了', endStreamDateId, endStreamTimeId, endStreamReserveButtonId, endStreamButtonId,
      function() {
        setTimeout(function() {
          document.querySelector('#end-stream-confirmation #confirm-button').click();
        }, 3000);
      }
    );
    if (endStreamTimeoutId !== null) {
      clearTimeout(endStreamTimeoutId);
    }
    endStreamTimeoutId = newTimeoutId;
  }

  const initMe = function() {
    let now = new Date();
    const nowOnAir = document.getElementById(startStreamButtonId).ariaDisabled === 'true';
    const displayInsertAdEl = document.createElement('span');
    displayInsertAdEl.innerHTML = `自動広告 起点: <span id="${insertAdBaseDatetimeId}">--</span>
&nbsp;初回:<select id="${insertAdSwitchId}">
<option value="90">90分後</option>
<option value="85">85分後</option>
<option value="70">70分後</option>
<option value="65">65分後</option>
<option value="60" selected>60分後</option>
<option value="55">55分後</option>
<option value="50">50分後</option>
<option value="45">45分後</option>
<option value="40">40分後</option>
<option value="35">35分後</option>
<option value="30">30分後</option>
<option value="25">25分後</option>
<option value="20">20分後</option>
<option value="15">15分後</option>
<option value="10">10分後</option>
<option value="5">5分後</option>
<option value="1">1分後</option>
<option value="-1">off</option>
</select>
<br />
<span id="${insertAdExecMonitorId}" style="font-size: 0.8em;">
実行間隔:<select id="${insertAdIntervalMinutesId}">
<option value="120">120分</option>
<option value="115">115分</option>
<option value="110">110分</option>
<option value="105">105分</option>
<option value="100">100分</option>
<option value="95">95分</option>
<option value="90">90分</option>
<option value="85">85分</option>
<option value="70">70分</option>
<option value="65">65分</option>
<option value="60">60分</option>
<option value="55">55分</option>
<option value="50">50分</option>
<option value="45">45分</option>
<option value="40">40分</option>
<option value="35">35分</option>
<option value="30">30分</option>
<option value="25">25分</option>
<option value="20">20分</option>
<option value="15" selected>15分</option>
<option value="10">10分</option>
<option value="5">5分</option>
</select>
　前回: <span id="${insertAdLastExecDatetimeId}">未実行</span>
　次回: <span id="${insertAdNextExecDatetimeId}">未実行</span>
</span>`;
    displayInsertAdEl.style.fontSize = '1.5em';
    displayInsertAdEl.style.fontWeight = 'bold';
    displayInsertAdEl.style.color = 'yellow';
    document.querySelector('.ytls-header.action-buttons').prepend(displayInsertAdEl);
    if (nowOnAir) {
      document.getElementById(insertAdBaseDatetimeId).innerText = now.toLocaleString();
    }
    document.getElementById(insertAdSwitchId).addEventListener('change', scheduleNextInsertAd);
    document.getElementById(insertAdIntervalMinutesId).addEventListener('change', scheduleNextInsertAd);
    scheduleNextInsertAd();

    const displayStreamTimerEl = document.createElement('span');
    displayStreamTimerEl.innerHTML = `<span id="${streamTimerMonitorId}" style="font-size: 0.8em;">
&nbsp;開始: <input type="date" id="${startStreamDateId}"><input type="time" id="${startStreamTimeId}"><button type="button" id="${startStreamReserveButtonId}">予約</button><br />
&nbsp;終了: <input type="date" id="${endStreamDateId}"><input type="time" id="${endStreamTimeId}"><button type="button" id="${endStreamReserveButtonId}">予約</button>
</span>`;
    displayStreamTimerEl.style.fontSize = '1.5em';
    displayStreamTimerEl.style.fontWeight = 'bold';
    displayStreamTimerEl.style.color = 'yellow';
    document.querySelector('.ytls-header.action-buttons').append(displayStreamTimerEl);
    let defaultYmd = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2) + '-' + ('0' + (now.getDate())).slice(-2);
    let defaultHm = now.toLocaleTimeString().substring(0, 5);
    document.getElementById(startStreamDateId).value = defaultYmd;
    document.getElementById(endStreamDateId).value = defaultYmd;
    document.getElementById(startStreamTimeId).value = defaultHm;
    document.getElementById(endStreamTimeId).value = defaultHm;
    document.getElementById(startStreamReserveButtonId).addEventListener('click', scheduleStartStream);
    document.getElementById(endStreamReserveButtonId).addEventListener('click', scheduleEndStream);
    if (!nowOnAir) {
      document.getElementById(startStreamButtonId).addEventListener('click', function() {
        // LIVE配信開始を直押しした場合にも広告自動挿入を起動する
        document.getElementById(insertAdBaseDatetimeId).innerText = new Date().toLocaleString();
        scheduleNextInsertAd();
      });
    }
  }

  setTimeout(initMe, 5 * 1000);

})();
