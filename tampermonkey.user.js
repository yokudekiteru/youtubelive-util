// ==UserScript==
// @name         YouTubeLiveユーティリティ
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  YouTubeStudioでのライブ配信を補助するツール
// @author       You
// @match        https://studio.youtube.com/video/*/livestreaming*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

/**
 * ミッドロール広告を挿入したいライブ配信画面のタブを開きっぱなしにしておけば、定期的に広告挿入ボタンをクリックする
 * 配信開始と終了の予約を可能とする（予約ボタン押下後は画面を開きっぱなしにしておくこと）。
 */

const DEFAULT_INTERVAL_MINUTES = 15;

(function() {
  'use strict';

  const insertAdButtonId = 'insert-ad-button';
  let insertAdNextTimeoutId = null;
  const insertAdSwitchId = 'ytlutil-insert-ad-switch';
  const insertAdOnAlertId = 'ytlutil-insert-ad-on-alert';
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
      scheduleNextInsertAd();
    } else {
      // 自動挿入を強制オフにする
      document.getElementById(insertAdSwitchId).value = 'off';
      scheduleNextInsertAd();
    }
  }

  const scheduleNextInsertAd = function() {

    const myFlag = document.getElementById(insertAdSwitchId).value === 'on';

    let now = new Date();
    let myInterval = (1 * document.getElementById(insertAdIntervalMinutesId).value) * 60 * 1000;
    let nextExecDatetime = new Date(now.getTime() + myInterval);

    // 次回実行をキャンセル
    if (insertAdNextTimeoutId !== null) {
      console.log('次回実行をキャンセル: ' + insertAdNextTimeoutId);
      clearTimeout(insertAdNextTimeoutId);
    }

    if (myFlag) {
      // 「タブを閉じないで！」を表示
      document.getElementById(insertAdOnAlertId).style.display = 'inline';
      // 次回実行予定を記入
      document.getElementById(insertAdNextExecDatetimeId).innerText = nextExecDatetime.toLocaleString();
      // 次回実行を登録
      console.log('次回実行を登録: interval=' + myInterval);
      insertAdNextTimeoutId = setTimeout(insertMidRollAd, myInterval);
      console.log('次回実行: ' + insertAdNextTimeoutId);
    } else {
      // 「タブを閉じないで！」を非表示
      document.getElementById(insertAdOnAlertId).style.display = 'none';
      // 次回実行予定を記入
      document.getElementById(insertAdNextExecDatetimeId).innerText = ' - ';
    }
  }

  const scheduleStream = function(startEnd, dateId, timeId, reserveButtonId, clickButtonId, dialogButtonSelector) {
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
      if (dialogButtonSelector) {
        setTimeout(function() {
          document.querySelector(dialogButtonSelector).click();
        }, 3000);
      }
    }, delay);
  }

  const scheduleStartStream = function() {
    let newTimeoutId = scheduleStream('開始', startStreamDateId, startStreamTimeId, startStreamReserveButtonId, startStreamButtonId, '');
    if (startStreamTimeoutId !== null) {
      clearTimeout(startStreamTimeoutId);
    }
    startStreamTimeoutId = newTimeoutId;
  }

  const scheduleEndStream = function() {
    let newTimeoutId = scheduleStream('終了', endStreamDateId, endStreamTimeId, endStreamReserveButtonId, endStreamButtonId, '#end-stream-confirmation #confirm-button');
    if (endStreamTimeoutId !== null) {
      clearTimeout(endStreamTimeoutId);
    }
    endStreamTimeoutId = newTimeoutId;
  }

  const initMe = function() {
    const displayInsertAdEl = document.createElement('span');
    displayInsertAdEl.innerHTML = `ミッドロール広告自動挿入
    <select id="${insertAdSwitchId}"><option value="on">on</option><option value="off">off</option></select>
    <span id="${insertAdOnAlertId}">タブを閉じないで！</span>
    <br />
    <span id="${insertAdExecMonitorId}" style="font-size: 0.8em;">
    実行間隔: <input type="number" id="${insertAdIntervalMinutesId}" value="${DEFAULT_INTERVAL_MINUTES}" style="width: 3em;" />分
    　次回予定: <span id="${insertAdNextExecDatetimeId}">未実行</span>
    　最終実行: <span id="${insertAdLastExecDatetimeId}">未実行</span>
    </span>`;
    displayInsertAdEl.style.fontSize = '1.5em';
    displayInsertAdEl.style.fontWeight = 'bold';
    displayInsertAdEl.style.color = 'yellow';
    document.querySelector('.ytls-header.action-buttons').prepend(displayInsertAdEl);
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
    let now = new Date();
    let defaultYmd = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2) + '-' + ('0' + (now.getDate())).slice(-2);
    let defaultHm = now.toLocaleTimeString().substring(0, 5);
    document.getElementById(startStreamDateId).value = defaultYmd;
    document.getElementById(endStreamDateId).value = defaultYmd;
    document.getElementById(startStreamTimeId).value = defaultHm;
    document.getElementById(endStreamTimeId).value = defaultHm;
    document.getElementById(startStreamReserveButtonId).addEventListener('click', scheduleStartStream);
    document.getElementById(endStreamReserveButtonId).addEventListener('click', scheduleEndStream);
  }

  setTimeout(initMe, 5 * 1000);

})();
