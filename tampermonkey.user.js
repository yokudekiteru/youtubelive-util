// ==UserScript==
// @name         YouTubeLiveユーティリティ
// @namespace    http://tampermonkey.net/
// @version      0.4.2
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
    const insertAdEl = document.createElement('span');
    insertAdEl.style.fontSize = '1.5em';
    insertAdEl.style.fontWeight = 'bold';
    insertAdEl.style.color = 'yellow';
    insertAdEl.append('自動広告 起点: ');
    const insertAdBaseDatetimeEl = document.createElement('span');
    insertAdBaseDatetimeEl.id = insertAdBaseDatetimeId;
    insertAdBaseDatetimeEl.innerText = '--';
    insertAdEl.append(insertAdBaseDatetimeEl);
    insertAdEl.append(' 初回:');
    const insertAdSwitchEl = document.createElement('select');
    insertAdSwitchEl.id = insertAdSwitchId;
    const adSwithOpt = {};
    adSwithOpt[-1] = 'off';
    adSwithOpt[1] = '1分後';
    for (let i = 5; i <= 90; i = i + 5) {
      adSwithOpt[i] = i + '分後';
    }
    Object.keys(adSwithOpt).forEach(function(k) {
      const opt = document.createElement('option');
      opt.value = k;
      opt.innerText = adSwithOpt[k];
      if (k == 60) {
        opt.selected = 'selected';
      }
      insertAdSwitchEl.append(opt);
    });
    insertAdEl.append(insertAdSwitchEl);
    insertAdEl.append(document.createElement('br'));

    const insertAdExecMonitorEl = document.createElement('span');
    insertAdExecMonitorEl.id = insertAdExecMonitorId;
    insertAdExecMonitorEl.style.fontSize = '0.8em';
    insertAdExecMonitorEl.append('実行間隔:');

    const insertAdIntervalMinutesEl = document.createElement('select');
    insertAdIntervalMinutesEl.id = insertAdIntervalMinutesId;
    const intervalMinutesOpt = {};
    intervalMinutesOpt[3] = '3分';
    for (let i = 5; i <= 120; i = i + 5) {
      intervalMinutesOpt[i] = i + '分';
    }
    Object.keys(intervalMinutesOpt).forEach(function(k) {
      const opt = document.createElement('option');
      opt.value = k;
      opt.innerText = intervalMinutesOpt[k];
      if (k == 15) {
        opt.selected = 'selected';
      }
      insertAdIntervalMinutesEl.append(opt);
    });
    insertAdExecMonitorEl.append(insertAdIntervalMinutesEl);
    insertAdEl.append(insertAdExecMonitorEl);
    insertAdEl.append('　前回: ');
    const insertAdLastExecDatetimeEl = document.createElement('span');
    insertAdLastExecDatetimeEl.id = insertAdLastExecDatetimeId;
    insertAdLastExecDatetimeEl.innerText = '未実行';
    insertAdEl.append(insertAdLastExecDatetimeEl);
    insertAdEl.append('　次回: ');
    const insertAdNextExecDatetimeEl = document.createElement('span');
    insertAdNextExecDatetimeEl.id = insertAdNextExecDatetimeId;
    insertAdNextExecDatetimeEl.innerText = '未実行';
    insertAdEl.append(insertAdNextExecDatetimeEl);

    document.querySelector('.ytls-header.action-buttons').prepend(insertAdEl);
    if (nowOnAir) {
      document.getElementById(insertAdBaseDatetimeId).innerText = now.toLocaleString();
    }
    document.getElementById(insertAdSwitchId).addEventListener('change', scheduleNextInsertAd);
    document.getElementById(insertAdIntervalMinutesId).addEventListener('change', scheduleNextInsertAd);
    scheduleNextInsertAd();

    const streamTimerEl = document.createElement('span');
    streamTimerEl.style.fontSize = '1.5em';
    streamTimerEl.style.fontWeight = 'bold';
    streamTimerEl.style.color = 'yellow';
    const streamTimerMonitorEl = document.createElement('span');
    streamTimerMonitorEl.id = streamTimerMonitorId;
    streamTimerMonitorEl.style.fontSize = '0.8em';
    // 開始予約コントロール
    streamTimerMonitorEl.append(' 開始: ');
    const startStreamDateEl = document.createElement('input');
    startStreamDateEl.id = startStreamDateId;
    startStreamDateEl.type = 'date';
    streamTimerMonitorEl.append(startStreamDateEl);
    const startStreamTimeEl = document.createElement('input');
    startStreamTimeEl.id = startStreamTimeId;
    startStreamTimeEl.type = 'time';
    streamTimerMonitorEl.append(startStreamTimeEl);
    const startStreamReserveButtonEl = document.createElement('button');
    startStreamReserveButtonEl.id = startStreamReserveButtonId;
    startStreamReserveButtonEl.innerText = '予約';
    streamTimerMonitorEl.append(startStreamReserveButtonEl);
    streamTimerMonitorEl.append(document.createElement('br'));
    // 終了予約コントロール
    streamTimerMonitorEl.append(' 終了: ');
    const endStreamDateEl = document.createElement('input');
    endStreamDateEl.id = endStreamDateId;
    endStreamDateEl.type = 'date';
    streamTimerMonitorEl.append(endStreamDateEl);
    const endStreamTimeEl = document.createElement('input');
    endStreamTimeEl.id = endStreamTimeId;
    endStreamTimeEl.type = 'time';
    streamTimerMonitorEl.append(endStreamTimeEl);
    const endStreamReserveButtonEl = document.createElement('button');
    endStreamReserveButtonEl.id = endStreamReserveButtonId;
    endStreamReserveButtonEl.innerText = '予約';
    streamTimerMonitorEl.append(endStreamReserveButtonEl);
    streamTimerEl.append(streamTimerMonitorEl);

    document.querySelector('.ytls-header.action-buttons').append(streamTimerEl);
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
