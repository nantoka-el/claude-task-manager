/**
 * Configuration Loader Module
 * 設定ファイルの動的読み込みと管理を行うモジュール
 * Windows/Mac/Linux完全対応
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * デフォルト設定
 */
const DEFAULT_CONFIG = {
    version: "1.0",
    statuses: [
        { key: "backlog", label: "BACKLOG", color: "#6b7280" },
        { key: "todo", label: "TODO", color: "#3b82f6" },
        { key: "review", label: "REVIEW", color: "#eab308" },
        { key: "done", label: "DONE", color: "#22c55e" }
    ],
    port: 5500,
    features: {
        search: true,
        fullTextSearch: true,
        autoRefresh: true,
        refreshInterval: 30000
    }
};

/**
 * プロジェクトの設定を読み込む
 * @param {string} projectDir - プロジェクトディレクトリ（省略時は現在のディレクトリ）
 * @returns {Object} マージされた設定オブジェクト
 */
export function loadProjectConfig(projectDir = process.cwd()) {
    const configPath = path.join(projectDir, '.taskconfig.json');
    
    try {
        if (fs.existsSync(configPath)) {
            const projectConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            // Deep merge with defaults
            return deepMerge(DEFAULT_CONFIG, projectConfig);
        }
    } catch (error) {
        console.warn(`設定ファイルの読み込みに失敗しました: ${configPath}`, error.message);
    }
    
    return { ...DEFAULT_CONFIG };
}

/**
 * グローバル設定を読み込む
 * @returns {Object} グローバル設定オブジェクト
 */
export function loadGlobalConfig() {
    const globalConfigPath = path.join(
        process.env.HOME || process.env.USERPROFILE,
        '.claude',
        'task-manager',
        'defaults',
        '.taskconfig.json'
    );
    
    try {
        if (fs.existsSync(globalConfigPath)) {
            return JSON.parse(fs.readFileSync(globalConfigPath, 'utf8'));
        }
    } catch (error) {
        console.warn('グローバル設定の読み込みに失敗しました:', error.message);
    }
    
    return { ...DEFAULT_CONFIG };
}

/**
 * ステータスリストを取得
 * @param {string} projectDir - プロジェクトディレクトリ
 * @returns {Array} ステータスオブジェクトの配列
 */
export function getStatuses(projectDir = process.cwd()) {
    const config = loadProjectConfig(projectDir);
    return config.statuses || DEFAULT_CONFIG.statuses;
}

/**
 * ステータスキーのリストを取得
 * @param {string} projectDir - プロジェクトディレクトリ
 * @returns {Array<string>} ステータスキーの配列
 */
export function getStatusKeys(projectDir = process.cwd()) {
    return getStatuses(projectDir).map(s => s.key);
}

/**
 * 設定を保存
 * @param {Object} config - 保存する設定オブジェクト
 * @param {string} projectDir - プロジェクトディレクトリ
 */
export function saveProjectConfig(config, projectDir = process.cwd()) {
    const configPath = path.join(projectDir, '.taskconfig.json');
    
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('設定の保存に失敗しました:', error.message);
        return false;
    }
}

/**
 * カスタムステータスから設定を生成
 * @param {string} statusesStr - カンマ区切りのステータス文字列
 * @returns {Object} 設定オブジェクト
 */
export function createConfigFromStatuses(statusesStr) {
    if (!statusesStr) return DEFAULT_CONFIG;
    
    const statuses = statusesStr.split(',').map(status => {
        const key = status.trim().toLowerCase();
        const label = status.trim().toUpperCase();
        
        // デフォルトカラーマッピング
        const colorMap = {
            backlog: "#6b7280",
            todo: "#3b82f6",
            doing: "#10b981",
            review: "#eab308",
            done: "#22c55e",
            blocked: "#ef4444",
            cancelled: "#6b7280"
        };
        
        return {
            key,
            label,
            color: colorMap[key] || "#6b7280"
        };
    });
    
    return {
        ...DEFAULT_CONFIG,
        statuses
    };
}

/**
 * Deep merge utility
 * @private
 */
function deepMerge(target, source) {
    const output = { ...target };
    
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    
    return output;
}

/**
 * Check if value is object
 * @private
 */
function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}

// CommonJS互換性のためのエクスポート
export default {
    loadProjectConfig,
    loadGlobalConfig,
    getStatuses,
    getStatusKeys,
    saveProjectConfig,
    createConfigFromStatuses,
    DEFAULT_CONFIG
};