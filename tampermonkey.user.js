// ==UserScript==
// @name         YouTubeLiveミッドロール広告自動挿入
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  ミッドロール広告を挿入したいライブ配信画面のタブを開きっぱなしにしておけば、定期的に広告挿入ボタンがクリックされます
// @author       You
// @match        https://studio.youtube.com/video/*/livestreaming
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

const DEFAULT_INTERVAL_MINUTES = 15;

(function() {
  'use strict';

  let nextTimeoutId = null;

  const insertAdButtonId = 'insert-ad-button';
  const insertAdSwitchId = 'ytlutil-insert-ad-switch';
  const insertAdOnAlertId = 'ytlutil-insert-ad-on-alert';
  const execMonitorId = 'ytlutil-exec-monitor';
  const lastExecDatetimeId = 'ytlutil-last-exec-datetime';
  const nextExecDatetimeId = 'ytlutil-next-exec-datetime';
  const intervalMinutesId = 'ytlutil-interval-minutes';

  const insertMidRollAd = function() {
    let insertAdButton = document.getElementById(insertAdButtonId);
    if (insertAdButton !== null && !insertAdButton.hidden) {
      console.log('処理実行');
      insertAdButton.click();
      document.getElementById(lastExecDatetimeId).innerText = new Date().toLocaleString();
      scheduleNext();
    } else {
      // 自動挿入を強制オフにする
      document.getElementById(insertAdSwitchId).value = 'off';
      scheduleNext();
    }
  }

  const scheduleNext = function() {

    const myFlag = document.getElementById(insertAdSwitchId).value === 'on';

    let now = new Date();
    let myInterval = (1 * document.getElementById(intervalMinutesId).value) * 60 * 1000;
    let nextExecDatetime = new Date(now.getTime() + myInterval);

    // 次回実行をキャンセル
    if (nextTimeoutId !== null) {
      console.log('次回実行をキャンセル: ' + nextTimeoutId);
      clearTimeout(nextTimeoutId);
    }

    if (myFlag) {
      // 「タブを閉じないで！」を表示
      document.getElementById(insertAdOnAlertId).style.display = 'inline';
      // 次回実行予定を記入
      document.getElementById(nextExecDatetimeId).innerText = nextExecDatetime.toLocaleString();
      // 次回実行を登録
      console.log('次回実行を登録: interval=' + myInterval);
      nextTimeoutId = setTimeout(insertMidRollAd, myInterval);
      console.log('次回実行: ' + nextTimeoutId);
    } else {
      // 「タブを閉じないで！」を非表示
      document.getElementById(insertAdOnAlertId).style.display = 'none';
      // 次回実行予定を記入
      document.getElementById(nextExecDatetimeId).innerText = ' - ';
    }
  }

  let initMe = function() {
    let displayEl = document.createElement('span');
    displayEl.innerHTML = `ミッドロール広告自動挿入
    <select id="${insertAdSwitchId}"><option value="on">on</option><option value="off">off</option></select>
    <span id="${insertAdOnAlertId}">タブを閉じないで！</span>
    <br />
    <span id="${execMonitorId}" style="font-size: 0.8em;">
    実行間隔: <input type="number" id="${intervalMinutesId}" value="${DEFAULT_INTERVAL_MINUTES}" style="width: 3em;" />分
    　次回予定： <span id="${nextExecDatetimeId}">未実行</span>
    　最終実行: <span id="${lastExecDatetimeId}">未実行</span>
    </span>`;
    displayEl.style.fontSize = '1.5em';
    displayEl.style.fontWeight = 'bold';
    displayEl.style.color = 'yellow';
    document.querySelector('.ytls-header.action-buttons').prepend(displayEl);
    document.getElementById(insertAdSwitchId).addEventListener('change', scheduleNext);
    document.getElementById(intervalMinutesId).addEventListener('change', scheduleNext);

    scheduleNext();
  }

  setTimeout(initMe, 5 * 1000);

})();
