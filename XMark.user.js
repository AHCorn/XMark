// ==UserScript==
// @name         X 收藏助手
// @namespace    https://github.com/ahcorn/XMark
// @version      0.2
// @license      GPL-3.0
// @description  追踪页面内的红心推文，转存至脚本记录内。
// @author       安和
// @match        https://twitter.com/*
// @match        https://x.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(`
        #favorites-panel, #export-panel, #custom-panel {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            opacity: 0;
            background: #15202b;
            color: #fff;
            padding: 24px;
            border-radius: 16px;
            box-shadow: 0 8px 28px rgba(0,0,0,0.28);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            transition: all 0.3s ease;
            visibility: hidden;
        }

        #custom-panel, #export-panel {
            width: 600px;
            max-width: 90vw;
            box-sizing: border-box;
        }

        #favorites-panel.show, #export-panel.show, #custom-panel.show {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
            visibility: visible;
        }

        #favorites-panel {
            max-height: 85vh;
            width: 600px;
            overflow-y: auto;
        }

        #export-panel {
            width: 480px;
            max-width: 90vw;
        }

        #custom-panel {
            width: 600px;
            max-width: 90vw;
        }

        #favorites-panel::-webkit-scrollbar,
        #export-panel::-webkit-scrollbar,
        #custom-panel::-webkit-scrollbar,
        .custom-code-logs::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        #favorites-panel::-webkit-scrollbar-track,
        #export-panel::-webkit-scrollbar-track,
        #custom-panel::-webkit-scrollbar-track,
        .custom-code-logs::-webkit-scrollbar-track {
            background: #1a2836;
            border-radius: 4px;
        }

        #favorites-panel::-webkit-scrollbar-thumb,
        #export-panel::-webkit-scrollbar-thumb,
        #custom-panel::-webkit-scrollbar-thumb,
        .custom-code-logs::-webkit-scrollbar-thumb {
            background: #38444d;
            border-radius: 4px;
        }

        .panel-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease;
            visibility: hidden;
        }

        .panel-overlay.show {
            opacity: 1;
            visibility: visible;
        }

        .panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom: 1px solid #38444d;
            position: sticky;
            top: -24px;
            background: #15202b;
            padding-top: 24px;
            margin-top: -24px;
            z-index: 1001;
        }

        .panel-title {
            font-size: 20px;
            font-weight: bold;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
        }

        .panel-buttons {
            display: flex;
            gap: 12px;
        }

        .search-filter-container {
            background: #192734;
            padding: 16px;
            border-radius: 12px;
            margin: -1px 0 16px;
            border: 1px solid #38444d;
            position: sticky;
            top: 60px;
            z-index: 1000;
        }

        .search-filter-container::before {
            content: '';
            position: absolute;
            top: -60px;
            left: 0;
            right: 0;
            height: 60px;
            background: #15202b;
            z-index: -1;
        }

        .search-section {
            display: flex;
            gap: 12px;
            margin-bottom: 12px;
            position: relative;
        }

        .search-type {
            background: #253341;
            color: #fff;
            border: 1px solid #38444d;
            border-radius: 20px;
            padding: 8px 16px;
            outline: none;
            font-size: 14px;
            width: 120px !important;
            flex-shrink: 0;
            min-width: 120px;
        }

        .search-input {
            flex-grow: 1;
            min-width: 0;
            width: calc(100% - 132px) !important;
        }

        .filter-section {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }

        .filter-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .filter-label {
            color: #8899a6;
            font-size: 12px;
        }
        .filter-select,
        .search-input,
        .filter-number {
            background: #253341;
            color: #fff;
            border: 1px solid #38444d;
            border-radius: 20px;
            padding: 8px 16px;
            outline: none;
            width: 100%;
            font-size: 14px;
        }

        .filter-select:focus,
        .search-input:focus,
        .filter-number:focus,
        .search-type:focus {
            border-color: #1d9bf0;
        }

        .author-suggestions {
            position: absolute;
            top: 100%;
            left: 132px;
            right: 0;
            background: #253341;
            border: 1px solid #38444d;
            border-radius: 12px;
            margin-top: 4px;
            max-height: 200px;
            overflow-y: auto;
            display: none;
            z-index: 2;
        }

        .author-suggestion-item {
            padding: 8px 16px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .author-suggestion-item:hover {
            background: #192734;
        }

        .author-count {
            background: #1d9bf0;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
        }

        .tweet-card {
            position: relative;
            background: #192734;
            border-radius: 12px;
            padding: 16px;
            margin: 12px 0;
            border: 1px solid #38444d;
            transition: all 0.2s ease;
        }

        .tweet-card:hover {
            border-color: #1d9bf0;
            transform: translateY(-1px);
        }

        .tweet-actions-top {
            position: absolute;
            top: 12px;
            right: 12px;
            display: flex;
            gap: 8px;
            z-index: 2;
            opacity: 0;
            transition: opacity 0.2s ease;
        }

        .tweet-card:hover .tweet-actions-top {
            opacity: 1;
        }

        .tweet-header {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            padding-right: 100px;
        }

        .tweet-avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            margin-right: 12px;
            object-fit: cover;
        }

        .tweet-author-info {
            flex-grow: 1;
        }

        .tweet-author-name {
            font-weight: bold;
            color: #fff;
            text-decoration: none;
            font-size: 16px;
        }

        .tweet-author-handle {
            color: #8899a6;
            font-size: 14px;
            margin-top: 2px;
        }

        .tweet-content {
            color: #fff;
            line-height: 1.5;
            margin: 12px 0;
            font-size: 15px;
            white-space: pre-wrap;
        }

        .tweet-images {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 8px;
            margin: 12px 0;
        }

        .tweet-image {
            width: 100%;
            height: 200px;
            border-radius: 8px;
            object-fit: cover;
            cursor: pointer;
            transition: opacity 0.2s ease;
            position: relative;
            background: linear-gradient(90deg, #192734 0%, #253341 50%, #192734 100%); 
            background-size: 200% 100%; 
            animation: shimmer 1.5s infinite;
        }
        
        .tweet-image:hover {
            opacity: 0.9;
        }

        .tweet-stats {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            padding: 12px 0;
            border-top: 1px solid #38444d;
            color: #8899a6;
            font-size: 13px;
        }

        .tweet-stat {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .tweet-stat svg {
            width: 16px;
            height: 16px;
            fill: currentColor;
        }

        .tweet-stat.liked svg {
            fill: #F91880;
            color: #F91880;
        }

        .tweet-dates {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #38444d;
            color: #8899a6;
            font-size: 12px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .panel-button {
            background: #1d9bf0;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .panel-button:hover {
            background: #1a8cd8;
            transform: translateY(-1px);
        }

        .panel-button.delete {
            background: #f4212e;
        }

        .panel-button.delete:hover {
            background: #dc1c27;
        }

        .panel-button svg {
            width: 16px;
            height: 16px;
            fill: currentColor;
        }

        .lightbox {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10002;
            backdrop-filter: blur(5px);
            opacity: 0;
            transition: opacity 0.3s ease;
            visibility: hidden;
        }

        .lightbox.show {
            opacity: 1;
            visibility: visible;
        }

        .lightbox-content {
            position: relative;
            max-width: 90vw;
            max-height: 90vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        

        .lightbox-image {
            max-width: 100%;
            max-height: 85vh;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
        }
        

        .lightbox-info-card {
            position: fixed;
            right: 20px;
            bottom: 20px;
            background: rgba(21, 32, 43, 0.9);
            backdrop-filter: blur(10px);
            padding: 20px;
            border-radius: 16px;
            border: 1px solid rgba(56, 68, 77, 0.5);
            color: white;
            width: 300px;
            max-width: 90vw;
            z-index: 10003;
            transition: none; 
            transform-origin: right bottom;
        }

        .lightbox-info-card.minimized {
            transform: scale(0.9);
            opacity: 0.8;
            padding: 12px;
            width: auto;
            cursor: pointer;
            border-radius: 12px;
        }

        .lightbox-info-card.minimized:hover {
            opacity: 1;
            transform: scale(0.95);
        }
        .lightbox-info-card.minimized .lightbox-info-text,
        .lightbox-info-card.minimized .lightbox-info-stats,
        .lightbox-info-card.minimized .lightbox-info-dates {
            display: none;
        }

        .lightbox-info-card.minimized .lightbox-info-author {
            margin-bottom: 0;
        }

        .lightbox-info-dates {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(56, 68, 77, 0.5);
            font-size: 12px;
            color: #8899a6;
        }

        .lightbox-info-author {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
        }

        .lightbox-info-text {
            margin-bottom: 12px;
            line-height: 1.5;
        }

        .lightbox-info-stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(56, 68, 77, 0.5);
        }

        .lightbox-nav {
            position: fixed;
            top: 50%;
            transform: translateY(-50%);
            color: white;
            font-size: 40px;
            cursor: pointer;
            background: rgba(21, 32, 43, 0.8);
            border: none;
            border-radius: 50%;
            width: 48px;
            height: 48px;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: all 0.2s ease;
            z-index: 10003;
            line-height: 0;
        }

        .lightbox-nav span {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
        }

        .lightbox-nav:hover {
            background: rgba(21, 32, 43, 0.95);
            transform: translateY(-50%) scale(1.1);
        }

        .lightbox-prev {
            left: 20px;
        }

        .lightbox-next {
            right: 20px;
        }

        .lightbox-close {
            position: fixed;
            top: 20px;
            right: 20px;
            color: white;
            font-size: 24px;
            cursor: pointer;
            background: rgba(21, 32, 43, 0.8);
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: all 0.2s ease;
            z-index: 10003;
        }

        .lightbox-close:hover {
            background: rgba(21, 32, 43, 0.95);
            transform: scale(1.1);
        }

        .lightbox-counter {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-size: 14px;
            background: rgba(21, 32, 43, 0.8);
            padding: 8px 16px;
            border-radius: 20px;
            z-index: 10003;
        }

        .export-content {
            display: flex;
            flex-direction: column;
            gap: 20px;
            width: 100%;
            box-sizing: border-box;
        }


        .export-section {
            background: #192734;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #38444d;
        }

        .export-section h3 {
            color: #fff;
            font-size: 16px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .export-options {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 16px;
            background: #253341;
            padding: 16px;
            border-radius: 12px;
        }

        .checkbox-label {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #fff;
            padding: 8px 12px;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .checkbox-label:hover {
            background: rgba(29, 155, 240, 0.1);
        }

        .checkbox-label input[type="checkbox"] {
            width: 16px;
            height: 16px;
            border-radius: 4px;
            border: 2px solid #38444d;
            appearance: none;
            outline: none;
            position: relative;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .checkbox-label input[type="checkbox"]:checked {
            background: #1d9bf0;
            border-color: #1d9bf0;
        }

        .checkbox-label input[type="checkbox"]:checked::after {
            content: '';
            position: absolute;
            left: 4px;
            top: 1px;
            width: 4px;
            height: 8px;
            border: solid white;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
        }

        .custom-code-editor {
            box-sizing: border-box;
            max-width: 100%;
            min-width: 100%;
            width: 100%;
        }

        .custom-code-logs {
            max-height: 150px;
            overflow-y: auto;
            background: #253341;
            border-radius: 8px;
            padding: 12px;
            font-family: monospace;
            font-size: 12px;
            color: #8899a6;
        }

        .log-entry {
            margin-bottom: 8px;
            padding: 4px 8px;
            border-left: 3px solid #1d9bf0;
            background: rgba(29, 155, 240, 0.1);
        }

        .notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #1d9bf0;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10001;
            font-weight: bold;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes shimmer {
            0% {
                background-position: 200% 0;
            }
            100% {
                background-position: -200% 0;
            }
        }
        
        .tweet-image.loaded {
            background: none;
            animation: none;
        }
        
        .loading-shimmer {
            position: relative;
            background: linear-gradient(90deg, #192734 0%, #253341 50%, #192734 100%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .lightbox-image-container {
            max-width: 90vw;
            max-height: 85vh;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
            background: linear-gradient(90deg, #192734 0%, #253341 50%, #192734 100%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
        }
        
        .lightbox-image-container.loaded {
            background: none;
            animation: none;
        }
        
        .lightbox-info-card.minimized {
            transform: scale(0.9);
            opacity: 0.8;
            padding: 12px;
            width: auto;
            cursor: pointer;
            border-radius: 12px;
        }
        
        .lightbox-info-card.minimized:hover {
            opacity: 1;
            transform: scale(0.95);
        }
        
        .lightbox-info-card.minimized .lightbox-info-text,
        .lightbox-info-card.minimized .lightbox-info-stats,
        .lightbox-info-card.minimized .lightbox-info-dates {
            display: none;
        }
        
        .lightbox-info-card.minimized .lightbox-info-author {
            margin-bottom: 0;
        }
        
        .tweet-image-container,
        .lightbox-image-container {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
            border-radius: 8px;
        }
        
        .tweet-image-container::before,
        .lightbox-image-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, #192734 0%, #253341 50%, #192734 100%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            pointer-events: none;
        }
        
        .tweet-image-container.loaded::before,
        .lightbox-image-container.loaded::before {
            display: none;
        }
        
    `);
    let favorites = GM_getValue('twitter_favorites', []);
    let processedTweets = new Set();
    let currentLightboxIndex = 0;
    let currentLightboxImages = [];
    let allImages = [];
    let currentImageInfo = null;
    let customCode = GM_getValue('custom_code', '');
    let customCodeLogs = [];
    let activeLightbox = null;
    let activePanel = null;
    let activeOverlay = null;

    // Twitter SVG Icons
    const TWITTER_ICONS = {
        reply: '<svg viewBox="0 0 24 24"><g><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path></g></svg>',
        retweet: '<svg viewBox="0 0 24 24"><g><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path></g></svg>',
        like: '<svg viewBox="0 0 24 24"><g><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path></g></svg>',
        liked: '<svg viewBox="0 0 24 24"><g><path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path></g></svg>',
        view: '<svg viewBox="0 0 24 24"><g><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"></path></g></svg>',
        close: '<svg viewBox="0 0 24 24"><g><path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"></path></g></svg>',
        export: '<svg viewBox="0 0 24 24"><g><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"></path></g></svg>'
    };
    function closeActivePanel() {
        if (activePanel) {
            const panel = activePanel;
            const overlay = activeOverlay;
            const isPanelFavorites = panel.id === 'favorites-panel';

            panel.classList.remove('show');
            if (overlay) {
                overlay.classList.remove('show');
            }

            setTimeout(() => {
                if (!isPanelFavorites) {
                    panel.remove();
                }
                if (overlay) {
                    overlay.remove();
                }

                if (activePanel === panel) {
                    activePanel = null;
                }
                if (activeOverlay === overlay) {
                    activeOverlay = null;
                }
            }, 300);
        }
    }
    function parseTwitterDate(timeElement) {
        try {
            const datetime = timeElement.getAttribute('datetime');
            if (datetime) {
                return new Date(datetime);
            }

            const dateText = timeElement.textContent.trim();

            if (dateText.includes('小时前')) {
                const hours = parseInt(dateText);
                const date = new Date();
                date.setHours(date.getHours() - hours);
                return date;
            }
            if (dateText.includes('分钟前')) {
                const minutes = parseInt(dateText);
                const date = new Date();
                date.setMinutes(date.getMinutes() - minutes);
                return date;
            }
            if (dateText.includes('秒前')) {
                const seconds = parseInt(dateText);
                const date = new Date();
                date.setSeconds(date.getSeconds() - seconds);
                return date;
            }

            const now = new Date();
            const year = now.getFullYear();

            if (dateText.includes('年')) {
                const [y, m, d] = dateText.split(/年|月|日/).map(n => parseInt(n));
                return new Date(y, m - 1, d);
            } else {
                const [m, d] = dateText.split(/月|日/).map(n => parseInt(n));
                return new Date(year, m - 1, d);
            }
        } catch (error) {
            console.error('日期解析错误:', error, timeElement);
            return new Date();
        }
    }

    function formatDate(date) {
        if (!date) return '';
        try {
            return new Date(date).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            console.error('日期格式化错误:', error, date);
            return '';
        }
    }

    function formatNumber(num) {
        if (num >= 10000) {
            return (num / 10000).toFixed(1) + '万';
        }
        return num.toLocaleString();
    }

    function cleanImageUrl(url) {
        if (!url) return '';
        const jpgIndex = url.indexOf('.jpg');
        if (jpgIndex !== -1) {
            return url.substring(0, jpgIndex + 4);
        }
        return url;
    }
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    function extractTweetStats(tweet) {
        const defaultStats = {
            replies: 0,
            retweets: 0,
            likes: 0,
            views: 0,
            bookmarks: 0
        };

        try {
            const statsContainer = tweet.querySelector('[role="group"]');
            if (!statsContainer) return defaultStats;

            const ariaLabel = statsContainer.getAttribute('aria-label');
            if (!ariaLabel) return defaultStats;

            const stats = {...defaultStats};

            const patterns = {
                replies: /(\d+(?:,\d+)*(?:\.\d+)?(?:万)?) *(?:条)?回复/,
                retweets: /(\d+(?:,\d+)*(?:\.\d+)?(?:万)?) *(?:次)?转[推帖]/,
                likes: /(\d+(?:,\d+)*(?:\.\d+)?(?:万)?) *(?:次)?喜欢/,
                views: /(\d+(?:,\d+)*(?:\.\d+)?(?:万)?) *(?:次)?(?:观看|查看)/,
                bookmarks: /(\d+(?:,\d+)*(?:\.\d+)?(?:万)?) *(?:次)?书签/
            };

            function parseNumber(text) {
                if (!text) return 0;
                text = text.trim().replace(/,/g, '');
                if (text.includes('万')) {
                    return Math.round(parseFloat(text.replace('万', '')) * 10000);
                }
                return parseInt(text) || 0;
            }

            Object.entries(patterns).forEach(([key, pattern]) => {
                const match = ariaLabel.match(pattern);
                if (match && match[1]) {
                    stats[key] = parseNumber(match[1]);
                }
            });

            return stats;
        } catch (error) {
            console.error('提取推文统计数据时出错:', error);
            return defaultStats;
        }
    }

function executeCustomCode(tweet) {
    if (!customCode) return;

    try {
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const func = new AsyncFunction('tweet', customCode);
        func(tweet).then(result => {
            const timestamp = new Date().toLocaleTimeString();
            customCodeLogs.unshift(`[${timestamp}] 执行成功: ${JSON.stringify(result)}`);
        }).catch(error => {
            console.error('自定义代码执行错误:', error);
            customCodeLogs.unshift(`[${new Date().toLocaleTimeString()}] 执行错误: ${error.message}`);
        });

        if (customCodeLogs.length > 100) {
            customCodeLogs.pop();
        }

        const logsContainer = document.querySelector('.custom-code-logs');
        if (logsContainer) {
            updateCustomCodeLogs();
        }
    } catch (error) {
        console.error('自定义代码执行错误:', error);
        customCodeLogs.unshift(`[${new Date().toLocaleTimeString()}] 执行错误: ${error.message}`);
    }
}


    function updateCustomCodeLogs() {
        const logsContainer = document.querySelector('.custom-code-logs');
        if (!logsContainer) return;

        logsContainer.innerHTML = customCodeLogs
            .map(log => `<div class="log-entry">${log}</div>`)
            .join('');
    }

    function isDuplicateTweet(newTweet) {
        return favorites.some(tweet =>
            tweet.author === newTweet.author &&
            tweet.text === newTweet.text &&
            tweet.publishDate === newTweet.publishDate
        );
    }

    function extractAuthorInfo(tweet) {
        try {
            const userNameElement = tweet.querySelector('[data-testid="User-Name"]');
            if (!userNameElement) return { author: 'Unknown', handle: '' };

            const fullText = userNameElement.textContent;
            const parts = fullText.split('·');
            if (parts.length < 2) return { author: fullText.trim(), handle: '' };

            const userPart = parts[0].trim();
            const atIndex = userPart.lastIndexOf('@');

            let author = userPart;
            let handle = '';

            if (atIndex !== -1) {
                author = userPart.substring(0, atIndex).trim();
                handle = userPart.substring(atIndex + 1).trim();
            }

            if (!handle) {
                const handleElement = tweet.querySelector('[data-testid="User-Name"] + div');
                if (handleElement) {
                    handle = handleElement.textContent.trim().replace('@', '');
                }
            }

            return {
                author: author || 'Unknown',
                handle: handle || 'unknown'
            };
        } catch (error) {
            console.error('提取作者信息时出错:', error);
            return { author: 'Unknown', handle: '' };
        }
    }


    async function downloadCurrentImage() {
        try {
            const currentImage = currentLightboxImages[currentLightboxIndex];
            const imgUrl = cleanImageUrl(currentImage.url);
            const info = currentImage.info;

            const response = await fetch(imgUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            const filename = `${info.author}_${new Date(info.publishDate).toISOString().slice(0,10)}_${currentLightboxIndex + 1}.jpg`;
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);

            showNotification('图片下载成功');
        } catch (error) {
            console.error('下载图片失败:', error);
            showNotification('下载失败: ' + error.message);
        }
    }
    function checkImageOverlap(imageRect, infoCardRect) {
        const margin = 20;
        const expandedInfoRect = {
            left: infoCardRect.left - margin,
            right: infoCardRect.right + margin,
            top: infoCardRect.top - margin,
            bottom: infoCardRect.bottom + margin
        };

        return !(imageRect.right < expandedInfoRect.left ||
                imageRect.left > expandedInfoRect.right ||
                imageRect.bottom < expandedInfoRect.top ||
                imageRect.top > expandedInfoRect.bottom);
    }
    function createLightbox(imageInfo, startIndex) {
        if (activeLightbox) {
            activeLightbox.remove();
        }
    
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        currentLightboxIndex = startIndex;
        currentLightboxImages = allImages;
        currentImageInfo = imageInfo;
        activeLightbox = lightbox;
    
        function updateLightboxContent() {
            const currentImage = currentLightboxImages[currentLightboxIndex];
            const info = currentImage.info;
    
            lightbox.innerHTML = `
                <div class="lightbox-content">
                    <button class="lightbox-close" title="关闭">${TWITTER_ICONS.close}</button>
                    <div class="lightbox-image-container">
                        <img src="${cleanImageUrl(currentImage.url)}" class="lightbox-image" alt="图片">
                    </div>
                    <button class="lightbox-nav lightbox-prev" title="上一张"><span>&lt;</span></button>
                    <button class="lightbox-nav lightbox-next" title="下一张"><span>&gt;</span></button>
                    <div class="lightbox-counter">${currentLightboxIndex + 1} / ${currentLightboxImages.length}</div>
                    <div class="lightbox-info-card minimized">
                        <div class="lightbox-info-author">
                            <img src="${info.authorAvatar}" class="tweet-avatar" style="width: 24px; height: 24px;">
                            <div>
                                <div>${info.author}</div>
                                <div style="color: #8899a6; font-size: 12px;">@${info.authorHandle}</div>
                            </div>
                        </div>
                        <div class="lightbox-info-text">${info.text}</div>
                        <div class="lightbox-info-stats">
                            <div class="tweet-stat">
                                ${TWITTER_ICONS.reply}
                                <span>${formatNumber(info.stats.replies)}</span>
                            </div>
                            <div class="tweet-stat">
                                ${TWITTER_ICONS.retweet}
                                <span>${formatNumber(info.stats.retweets)}</span>
                            </div>
                            <div class="tweet-stat liked">
                                ${TWITTER_ICONS.liked}
                                <span>${formatNumber(info.stats.likes)}</span>
                            </div>
                            <div class="tweet-stat">
                                ${TWITTER_ICONS.view}
                                <span>${formatNumber(info.stats.views)}</span>
                            </div>
                        </div>
                        <div class="lightbox-info-dates">
                            <div>发布时间: ${formatDate(info.publishDate)}</div>
                            <div>收藏时间: ${formatDate(info.favoriteDate)}</div>
                        </div>
                    </div>
                </div>
            `;
    
            const infoCard = lightbox.querySelector('.lightbox-info-card');
            const imageContainer = lightbox.querySelector('.lightbox-image-container');
            const image = lightbox.querySelector('.lightbox-image');
    
            imageContainer.classList.add('loading-shimmer');
            
            image.onload = () => {
                imageContainer.classList.remove('loading-shimmer');
                checkOverlap();
            };
    
            function checkOverlap() {
                const imageRect = image.getBoundingClientRect();
                const infoCardRect = infoCard.getBoundingClientRect();
    
                if (checkImageOverlap(imageRect, infoCardRect)) {
                    infoCard.classList.add('minimized');
                }
            }
    
            function toggleInfoCard(animate) {
                if (animate) {
                    infoCard.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                } else {
                    infoCard.style.transition = 'none';
                }
                infoCard.classList.toggle('minimized');
            }
    
            infoCard.addEventListener('click', (e) => {
                if (infoCard.classList.contains('minimized')) {
                    requestAnimationFrame(() => {
                        toggleInfoCard(true);
                    });
                    e.stopPropagation();
                }
            });
    
            lightbox.querySelector('.lightbox-close').onclick = () => {
                lightbox.classList.remove('show');
                setTimeout(() => {
                    lightbox.remove();
                    activeLightbox = null;
                    window.removeEventListener('resize', checkOverlap);
                }, 300);
            };
    
            lightbox.querySelector('.lightbox-prev').onclick = () => {
                currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxImages.length) % currentLightboxImages.length;
                updateLightboxContent();
            };
    
            lightbox.querySelector('.lightbox-next').onclick = () => {
                currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxImages.length;
                updateLightboxContent();
            };
    
            window.addEventListener('resize', checkOverlap);
        }
    
        document.body.appendChild(lightbox);
        requestAnimationFrame(() => {
            lightbox.classList.add('show');
            updateLightboxContent();
        });
    
        function handleKeyboard(e) {
            if (!activeLightbox) return;
    
            if (e.key === 'Escape') {
                lightbox.querySelector('.lightbox-close').click();
            }
            if (e.key === 'ArrowLeft') lightbox.querySelector('.lightbox-prev').click();
            if (e.key === 'ArrowRight') lightbox.querySelector('.lightbox-next').click();
            if (e.key === 'Enter') downloadCurrentImage();
            if (e.key === 'i' || e.key === 'I') {
                const infoCard = lightbox.querySelector('.lightbox-info-card');
                requestAnimationFrame(() => {
                    toggleInfoCard(true);
                });
                e.preventDefault();
            }
        }
    
        document.addEventListener('keydown', handleKeyboard);
        lightbox.addEventListener('remove', () => {
            document.removeEventListener('keydown', handleKeyboard);
        });
    }
    

    async function downloadImages(favorites) {
        const totalImages = favorites.reduce((count, tweet) => count + (tweet.images?.length || 0), 0);

        if (totalImages === 0) {
            showNotification('没有找到可下载的图片');
            return;
        }

        if (!confirm(`将开始下载 ${totalImages} 张图片，是否继续？`)) {
            return;
        }

        showNotification(`开始下载 ${totalImages} 张图片...`);

        let completed = 0;

        for (const tweet of favorites) {
            if (!tweet.images?.length) continue;

            for (let i = 0; i < tweet.images.length; i++) {
                try {
                    const imgUrl = cleanImageUrl(tweet.images[i]);
                    const response = await fetch(imgUrl);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);

                    const a = document.createElement('a');
                    const filename = `${tweet.author}_${new Date(tweet.publishDate).toISOString().slice(0,10)}_${i + 1}.jpg`;
                    a.href = url;
                    a.download = filename;
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    a.click();

                    setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    }, 100);

                    completed++;
                    showNotification(`下载进度: ${completed}/${totalImages}`);

                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error) {
                    console.error(`下载失败: ${imgUrl}`, error);
                    showNotification(`下载失败: ${error.message}`);
                }
            }
        }

        showNotification('所有图片下载完成！');
    }
    function createExportPanel() {
        const panel = document.createElement('div');
        panel.id = 'export-panel';
        const prevPanel = activePanel;
        const prevOverlay = activeOverlay;

        activePanel = panel;

        panel.innerHTML = `
            <div class="panel-header">
                <div class="panel-title">
                    ${TWITTER_ICONS.export}
                    <span>导出收藏</span>
                </div>
                <button class="panel-button" id="close-export-panel">
                    ${TWITTER_ICONS.close}
                    <span>关闭</span>
                </button>
            </div>
            <div class="export-content">
                <div class="export-section">
                    <h3>导出到剪贴板</h3>
                    <div class="export-options">
                        <label class="checkbox-label">
                            <input type="checkbox" id="export-author" checked> 作者信息
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="export-content" checked> 推文内容
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="export-images" checked> 图片链接
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="export-url" checked> 原文链接
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="export-publish-date" checked> 发布时间
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="export-favorite-date" checked> 收藏时间
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="export-stats" checked> 互动数据
                        </label>
                    </div>
                    <button class="panel-button" id="copy-to-clipboard">复制到剪贴板</button>
                </div>
                <div class="export-section">
                    <h3>下载图片</h3>
                    <p style="color: #8899a6; margin-bottom: 12px;">将逐个下载所有图片，请确保浏览器允许多文件下载。</p>
                    <button class="panel-button" id="download-images">下载所有图片</button>
                </div>
            </div>
        `;

        const overlay = document.createElement('div');
        overlay.className = 'panel-overlay';
        activeOverlay = overlay;
        document.body.appendChild(overlay);
        document.body.appendChild(panel);

        requestAnimationFrame(() => {
            overlay.classList.add('show');
            panel.classList.add('show');
        });

        overlay.addEventListener('click', () => {
            closeActivePanel();
            if (prevPanel && prevPanel.id === 'favorites-panel') {
                activePanel = prevPanel;
                activeOverlay = prevOverlay;
            }
        });

        document.getElementById('close-export-panel').addEventListener('click', () => {
            closeActivePanel();
            if (prevPanel && prevPanel.id === 'favorites-panel') {
                activePanel = prevPanel;
                activeOverlay = prevOverlay;
            }
        });

        document.getElementById('copy-to-clipboard').addEventListener('click', () => {
            const includeAuthor = document.getElementById('export-author').checked;
            const includeContent = document.getElementById('export-content').checked;
            const includeImages = document.getElementById('export-images').checked;
            const includeUrl = document.getElementById('export-url').checked;
            const includePublishDate = document.getElementById('export-publish-date').checked;
            const includeFavoriteDate = document.getElementById('export-favorite-date').checked;
            const includeStats = document.getElementById('export-stats').checked;

            let exportText = favorites.map(tweet => {
                let parts = [];
                if (includeAuthor) parts.push(`作者: ${tweet.author} (@${tweet.authorHandle})`);
                if (includeContent) parts.push(`内容: ${tweet.text}`);
                if (includeImages && tweet.images?.length) {
                    parts.push(`图片:\n${tweet.images.map(cleanImageUrl).join('\n')}`);
                }
                if (includeUrl) parts.push(`链接: ${tweet.url}`);
                if (includePublishDate) parts.push(`发布时间: ${formatDate(tweet.publishDate)}`);
                if (includeFavoriteDate) parts.push(`收藏时间: ${formatDate(tweet.favoriteDate)}`);
                if (includeStats) {
                    parts.push(`互动数据:
    回复: ${formatNumber(tweet.stats.replies)}
    转发: ${formatNumber(tweet.stats.retweets)}
    喜欢: ${formatNumber(tweet.stats.likes)}
    查看: ${formatNumber(tweet.stats.views)}
    书签: ${formatNumber(tweet.stats.bookmarks)}`);
                }
                return parts.join('\n');
            }).join('\n\n---\n\n');

            navigator.clipboard.writeText(exportText).then(() => {
                showNotification('已复制到剪贴板');
            });
        });

        document.getElementById('download-images').addEventListener('click', () => {
            downloadImages(favorites);
        });

        return panel;
    }


    function createCustomPanel() {
        const panel = document.createElement('div');
        panel.id = 'custom-panel';
        const prevPanel = activePanel;
        const prevOverlay = activeOverlay;

        activePanel = panel;

        panel.innerHTML = `
            <div class="panel-header">
                <div class="panel-title">自定义代码</div>
                <button class="panel-button" id="close-custom-panel">
                    ${TWITTER_ICONS.close}
                    <span>关闭</span>
                </button>
            </div>
            <div class="export-section">
                <h3>JavaScript 代码</h3>
                <p style="color: #8899a6; margin-bottom: 12px;">
                    在这里编写的代码将在每次发现新的收藏时执行。<br>
                    可以通过 tweet 参数访问推文的所有信息。
                </p>
                <textarea class="custom-code-editor" placeholder="输入自定义JavaScript代码...
    例如:
    // tweet 参数包含推文的所有信息
    console.log(tweet);
    // 返回值会显示在日志中
    return '处理完成';
    ">${customCode}</textarea>
                <button class="panel-button" id="save-custom-code">保存代码</button>
            </div>
            <div class="export-section">
                <h3>执行日志</h3>
                <div class="custom-code-logs"></div>
            </div>
        `;

        const overlay = document.createElement('div');
        overlay.className = 'panel-overlay';
        activeOverlay = overlay;
        document.body.appendChild(overlay);
        document.body.appendChild(panel);

        requestAnimationFrame(() => {
            overlay.classList.add('show');
            panel.classList.add('show');
        });

        overlay.addEventListener('click', () => {
            closeActivePanel();
            if (prevPanel && prevPanel.id === 'favorites-panel') {
                activePanel = prevPanel;
                activeOverlay = prevOverlay;
            }
        });

        document.getElementById('close-custom-panel').addEventListener('click', () => {
            closeActivePanel();
            if (prevPanel && prevPanel.id === 'favorites-panel') {
                activePanel = prevPanel;
                activeOverlay = prevOverlay;
            }
        });

        document.getElementById('save-custom-code').addEventListener('click', () => {
            const code = document.querySelector('.custom-code-editor').value;
            customCode = code;
            GM_setValue('custom_code', code);
            showNotification('自定义代码已保存');
        });

        updateCustomCodeLogs();

        return panel;
    }

    function setupSearchAndFilter(container) {
        const filterSection = container.querySelector('.filter-section');
        filterSection.innerHTML = `
            <select class="filter-select time-filter">
                <option value="publish">按发布时间</option>
                <option value="favorite">按收藏时间</option>
                <option value="likes">按喜欢数</option>
                <option value="retweets">按转发数</option>
                <option value="replies">按回复数</option>
                <option value="views">按查看数</option>
            </select>
            <select class="filter-select sort-order">
                <option value="desc">倒序</option>
                <option value="asc">正序</option>
            </select>
        `;

        const searchType = container.querySelector('.search-type');
        const searchInput = container.querySelector('.search-input');
        const authorSuggestions = container.querySelector('.author-suggestions');
        const timeFilter = container.querySelector('.time-filter');
        const sortOrder = container.querySelector('.sort-order');

        function getAuthorStats() {
            const stats = {};
            favorites.forEach(tweet => {
                stats[tweet.author] = (stats[tweet.author] || 0) + 1;
            });
            return Object.entries(stats)
                .filter(([_, count]) => count >= 2)
                .sort((a, b) => b[1] - a[1]);
        }

        function showAuthorSuggestions() {
            if (searchType.value !== 'author') return;

            const stats = getAuthorStats();
            if (stats.length === 0) return;

            authorSuggestions.innerHTML = stats.map(([author, count]) => `
                <div class="author-suggestion-item" data-author="${author}">
                    <span>${author}</span>
                    <span class="author-count">${count}</span>
                </div>
            `).join('');

            authorSuggestions.style.display = 'block';

            authorSuggestions.querySelectorAll('.author-suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    searchInput.value = item.dataset.author;
                    authorSuggestions.style.display = 'none';
                    filterTweets();
                });
            });
        }

        function filterTweets() {
            const searchQuery = searchInput.value.toLowerCase();
            const isAuthorSearch = searchType.value === 'author';
            const filterType = timeFilter.value;
            const isDescending = sortOrder.value === 'desc';

            let filtered = favorites.filter(tweet => {
                if (!searchQuery) return true;

                if (isAuthorSearch) {
                    return tweet.author.toLowerCase().includes(searchQuery);
                } else {
                    return tweet.text.toLowerCase().includes(searchQuery) ||
                           tweet.author.toLowerCase().includes(searchQuery);
                }
            });

            filtered.sort((a, b) => {
                let valueA, valueB;

                switch (filterType) {
                    case 'publish':
                        valueA = new Date(a.publishDate);
                        valueB = new Date(b.publishDate);
                        break;
                    case 'favorite':
                        valueA = new Date(a.favoriteDate);
                        valueB = new Date(b.favoriteDate);
                        break;
                    case 'likes':
                        valueA = a.stats.likes || 0;
                        valueB = b.stats.likes || 0;
                        break;
                    case 'retweets':
                        valueA = a.stats.retweets || 0;
                        valueB = b.stats.retweets || 0;
                        break;
                    case 'replies':
                        valueA = a.stats.replies || 0;
                        valueB = b.stats.replies || 0;
                        break;
                    case 'views':
                        valueA = a.stats.views || 0;
                        valueB = b.stats.views || 0;
                        break;
                    default:
                        valueA = new Date(a.publishDate);
                        valueB = new Date(b.publishDate);
                }

                return isDescending ? (valueB - valueA) : (valueA - valueB);
            });

            allImages = [];
            filtered.forEach(tweet => {
                if (tweet.images) {
                    tweet.images.forEach(url => {
                        allImages.push({
                            url: url,
                            info: {
                                author: tweet.author,
                                authorHandle: tweet.authorHandle,
                                authorAvatar: tweet.authorAvatar,
                                text: tweet.text,
                                publishDate: tweet.publishDate,
                                favoriteDate: tweet.favoriteDate,
                                stats: tweet.stats
                            }
                        });
                    });
                }
            });

            const tweetsContainer = container.querySelector('.tweets-container');
            tweetsContainer.innerHTML = filtered.map((tweet, index) => `
                <div class="tweet-card">
                    <div class="tweet-actions-top">
                        <button class="panel-button view-original" data-url="${tweet.url}">
                            <span>查看原文</span>
                        </button>
                        <button class="panel-button delete" data-index="${index}">
                            ${TWITTER_ICONS.close}
                            <span>删除</span>
                        </button>
                    </div>
                    <div class="tweet-header">
                        <img src="${tweet.authorAvatar}" class="tweet-avatar" onerror="this.src='https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png'">
                        <div class="tweet-author-info">
                            <a href="https://twitter.com/${tweet.authorHandle}" class="tweet-author-name" target="_blank">${tweet.author}</a>
                            <div class="tweet-author-handle">@${tweet.authorHandle}</div>
                        </div>
                    </div>
                    <div class="tweet-content">${tweet.text}</div>
                    ${tweet.images && tweet.images.length ? `
                        <div class="tweet-images">
                            ${tweet.images.map((img, imgIndex) => `
                                <img src="${cleanImageUrl(img)}" class="tweet-image" data-index="${allImages.findIndex(i => i.url === img)}" data-tweet-index="${index}">
                            `).join('')}
                        </div>
                    ` : ''}
                    <div class="tweet-stats">
                        <div class="tweet-stat">
                            ${TWITTER_ICONS.reply}
                            <span>${formatNumber(tweet.stats?.replies || 0)}</span>
                        </div>
                        <div class="tweet-stat">
                            ${TWITTER_ICONS.retweet}
                            <span>${formatNumber(tweet.stats?.retweets || 0)}</span>
                        </div>
                        <div class="tweet-stat liked">
                            ${TWITTER_ICONS.liked}
                            <span>${formatNumber(tweet.stats?.likes || 0)}</span>
                        </div>
                        <div class="tweet-stat">
                            ${TWITTER_ICONS.view}
                            <span>${formatNumber(tweet.stats?.views || 0)}</span>
                        </div>
                    </div>
                    <div class="tweet-dates">
                        <div>发布时间: ${formatDate(tweet.publishDate)}</div>
                        <div>收藏时间: ${formatDate(tweet.favoriteDate)}</div>
                    </div>
                </div>
            `).join('');

            bindTweetEvents(tweetsContainer);
        }

        timeFilter.addEventListener('change', filterTweets);
        sortOrder.addEventListener('change', filterTweets);
        searchType.addEventListener('change', () => {
            if (searchType.value === 'author') {
                showAuthorSuggestions();
            } else {
                authorSuggestions.style.display = 'none';
            }
            filterTweets();
        });

        searchInput.addEventListener('input', () => {
            if (searchType.value === 'author') {
                showAuthorSuggestions();
            }
            filterTweets();
        });

        searchInput.addEventListener('focus', () => {
            if (searchType.value === 'author') {
                showAuthorSuggestions();
            }
        });

        document.addEventListener('click', (e) => {
            if (!authorSuggestions.contains(e.target) && e.target !== searchInput) {
                authorSuggestions.style.display = 'none';
            }
        });

        filterTweets();
    }
    function bindTweetEvents(container) {
        container.querySelectorAll('.tweet-image').forEach(img => {
            img.addEventListener('click', () => {
                const imageIndex = parseInt(img.dataset.index);
                const tweetIndex = parseInt(img.dataset.tweetIndex);
                const tweet = favorites[tweetIndex];
                if (tweet) {
                    createLightbox(tweet, imageIndex);
                }
            });
        });

        container.querySelectorAll('.view-original').forEach(button => {
            button.addEventListener('click', () => {
                window.open(button.dataset.url, '_blank');
            });
        });

        container.querySelectorAll('.delete').forEach(button => {
            button.addEventListener('click', () => {
                const index = parseInt(button.dataset.index);
                if (confirm('确定要删除这条收藏吗？')) {
                    favorites.splice(index, 1);
                    GM_setValue('twitter_favorites', favorites);
                    updatePanel();
                    showNotification('已删除收藏');
                }
            });
        });
    }

    function createPanel() {
        const existingPanel = document.getElementById('favorites-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        const panel = document.createElement('div');
        panel.id = 'favorites-panel';
        activePanel = panel;

        panel.innerHTML = `
            <div class="panel-header">
                <div class="panel-title">收藏的推文</div>
                <div class="panel-buttons">
                    <button class="panel-button" id="custom-settings">自定义设置</button>
                    <button class="panel-button" id="export-favorites">导出</button>
                    <button class="panel-button delete" id="clear-favorites">清除所有</button>
                    <button class="panel-button" id="close-panel">关闭</button>
                </div>
            </div>
            <div id="favorites-content"></div>
        `;

        const overlay = document.createElement('div');
        overlay.className = 'panel-overlay';
        activeOverlay = overlay;
        document.body.appendChild(overlay);
        document.body.appendChild(panel);

        requestAnimationFrame(() => {
            overlay.classList.add('show');
            panel.classList.add('show');
        });

        overlay.addEventListener('click', () => closeActivePanel());
        document.getElementById('close-panel').addEventListener('click', () => closeActivePanel());

        document.getElementById('clear-favorites').addEventListener('click', () => {
            if (confirm('确定要清除所有收藏记录吗？此操作不可恢复！')) {
                favorites = [];
                GM_setValue('twitter_favorites', favorites);
                updatePanel();
                showNotification('已清除所有收藏');
            }
        });

        document.getElementById('export-favorites').addEventListener('click', () => {
            createExportPanel();
        });

        document.getElementById('custom-settings').addEventListener('click', () => {
            createCustomPanel();
        });

        updatePanel();
        return panel;
    }

    function updatePanel() {
        const content = document.getElementById('favorites-content');
        if (!content) return;

        if (favorites.length === 0) {
            content.innerHTML = '<div style="text-align: center; padding: 20px; color: #8899a6;">暂无收藏的推文</div>';
            return;
        }

        content.innerHTML = `
            <div class="search-filter-container">
                <div class="search-section">
                    <select class="search-type filter-select">
                        <option value="all">全文搜索</option>
                        <option value="author">作者搜索</option>
                    </select>
                    <input type="text" class="search-input" placeholder="输入搜索内容...">
                    <div class="author-suggestions"></div>
                </div>
                <div class="filter-section">
                    <!-- 在setupSearchAndFilter中动态填充 -->
                </div>
            </div>
            <div class="tweets-container"></div>
        `;

        setupSearchAndFilter(content);
    }

    function checkForLikedTweets() {
        document.querySelectorAll('article').forEach(tweet => {
            const tweetId = tweet.getAttribute('data-tweet-id') || tweet.innerHTML;
            if (processedTweets.has(tweetId)) return;

            const likeButton = tweet.querySelector('[data-testid="unlike"]');
            if (likeButton) {
                try {
                    const timeElement = tweet.querySelector('time');
                    const publishDate = timeElement ?
                        new Date(timeElement.getAttribute('datetime')).toISOString() :
                        new Date().toISOString();

                    const tweetUrl = `https://x.com${tweet.querySelector('time').closest('a').getAttribute('href')}`;
                    const stats = extractTweetStats(tweet);
                    const { author, handle } = extractAuthorInfo(tweet);

                    const tweetData = {
                        author: author,
                        authorHandle: handle,
                        authorAvatar: tweet.querySelector('img[src*="profile_images"]')?.src || '',
                        text: tweet.querySelector('[data-testid="tweetText"]')?.textContent?.trim() || '',
                        publishDate: publishDate,
                        favoriteDate: new Date().toISOString(),
                        url: tweetUrl,
                        images: Array.from(tweet.querySelectorAll('img[src*="/media/"]')).map(img => cleanImageUrl(img.src)),
                        stats: stats
                    };

                    if (!isDuplicateTweet(tweetData)) {
                        favorites.push(tweetData);
                        GM_setValue('twitter_favorites', favorites);
                        showNotification('发现新的收藏');

                        executeCustomCode(tweetData);

                        const panel = document.getElementById('favorites-panel');
                        if (panel && panel.classList.contains('show')) {
                            updatePanel();
                        }
                    }

                    processedTweets.add(tweetId);
                } catch (error) {
                    console.error('处理推文时出错:', error);
                }
            }
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeActivePanel();
        }
        if (e.key === 'f' || e.key === 'F') {
            const panel = document.getElementById('favorites-panel');
            if (!panel || !panel.classList.contains('show')) {
                createPanel();
            } else {
                closeActivePanel();
            }
            e.preventDefault();
        }
    });


    function init() {
        GM_registerMenuCommand('打开面板', () => {
            createPanel();
        });

        checkForLikedTweets();
        setInterval(checkForLikedTweets, 2000);

        document.addEventListener('click', e => {
            const button = e.target.closest('button');
            if (!button) return;

            const ariaLabel = button.getAttribute('aria-label');
            if (ariaLabel && ariaLabel.includes('喜欢')) {
                setTimeout(checkForLikedTweets, 500);
            }
        });

        console.log('XMark 已初始化');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
