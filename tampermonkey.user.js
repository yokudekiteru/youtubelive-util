// ==UserScript==
// @name         YouTubeLiveミッドロール広告自動挿入
// @namespace    http://tampermonkey.net/
// @version      0.1.1
// @description  ミッドロール広告を挿入したいライブ配信画面のタブを開きっぱなしにしておけば、定期的に広告挿入ボタンがクリックされます
// @author       You
// @match        https://studio.youtube.com/video/*/livestreaming
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

const INTERVAL_MINUTES = 15;

(function() {
  'use strict';

  const lastExecDatetimeId = 'last-exec-datetime';

  let insertMidRollAd = function() {
    document.getElementById('insert-ad-button').click();
    document.getElementById(lastExecDatetimeId).innerText = new Date().toLocaleString();
  }

  setInterval(insertMidRollAd, INTERVAL_MINUTES * 60 * 1000);

  let showAlert = function() {
    let myLabel = document.createElement('label');
    myLabel.innerHTML = 'タブを閉じないで！ミッドロール広告自動挿入実行中<br />実行間隔: ' + INTERVAL_MINUTES + '分、最終実行日時: <span id="' + lastExecDatetimeId + '">未実行</span>';
    myLabel.style.fontSize = '1.5em';
    myLabel.style.fontWeight = 'bold';
    myLabel.style.color = 'yellow';
    document.querySelector('.ytls-header.action-buttons').prepend(myLabel);
  }

  setTimeout(showAlert, 5 * 1000);

})();
