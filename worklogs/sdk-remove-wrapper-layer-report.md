# SDK API 遷移 - 移除包裝層報告

**日期**: 2025-12-29
**任務**: 移除 `*.sdk.ts` 包裝層，直接使用 SDK

---

## 執行摘要

嘗試移除 `workflows.sdk.ts`、`tasks.sdk.ts`、`containers.sdk.ts` 包裝層，改為直接使用 SDK。雖然成功移除了包裝層檔案，但在遷移過程中遇到了一些 TypeScript 編譯問題需要解決。

---

## 已完成的工作

### 1. 移除包裝層檔案

已移除以下檔案：
- `src/lib/api/workflows.sdk.ts`
- `src/lib/api/tasks.sdk.ts`
- `src/lib/api/containers.sdk.ts`

### 2. 簡化 `src/lib/api/index.ts`

- 只保留 UI 輔助函式和工具
- 直接匯出必要的任務相關函式（內部使用 SDK）
- 移除對已刪除檔案的引用

### 3. 更新 `src/lib/api.ts`

- 將工作流程相關方法改為使用 SDK
- 保持其他 API（Organization, Workspace, Project, Sandbox）暫時使用 `authenticatedFetch`

---

## 架構變更

### 之前的架構

```
組件
  ↓
useXxxApi() Hook (在 *.sdk.ts 中)
  ↓
SDK
```

### 新的架構（目標）

```
組件
  ↓
直接使用 SDK (useAInTandem hook 或 getClient())
  ↓
SDK
```

### 目前的過渡架構

```
組件
  ↓
直接函式匯出 (src/lib/api/index.ts)
  ↓
SDK
```

---

## 剩餘問題

### TypeScript 編譯錯誤

1. **部分函式無法被找到**:
   ```
   Module '"@/lib/api"' has no exported member 'executeAdhocTask'
   Module '"@/lib/api"' has no exported member 'getProjectTasks'
   Module '"@/lib/api"' has no exported member 'rerunTask'
   Module '"@/lib/api"' has no exported member 'executeWorkflowStep'
   Module '"@/lib/api"' has no exported member 'getStatusDisplayName'
   Module '"@/lib/api"' has no exported member 'getStatusBadgeVariant'
   ```

   這些函式確實在 `src/lib/api/index.ts` 中有定義和匯出，但 TypeScript 編譯器找不到它們。

2. **型別不相容**:
   - SDK 的 `Workflow` 型別與應用程式的 `Workflow` 型別不相容
   - 缺少 `currentVersion`, `isTemplate` 等欄位

3. **Settings API 型別問題**:
   - `UserSettings` 與 `SettingsData` 型別不相容

### 可能的原因

1. **模組解析順序問題** - `workflow.ts` 或其他依賴模組的錯誤可能影響 `index.ts` 的解析
2. **TypeScript 快取問題**
3. **循環依賴**

---

## 後續工作

### 短期（修復編譯錯誤）

1. 診斷並修復 TypeScript 找不到匯出的問題
2. 修復 `workflow.ts` 中的模組匯入錯誤
3. 處理型別不相容問題

### 中期（完成遷移）

1. 更新所有組件直接使用 `useAInTandem()` hook
2. 移除 `src/lib/api.ts` 中的 `api` 物件
3. 將 Organization, Workspace, Project APIs 也遷移至 SDK

### 長期（清理）

1. 移除 `authenticatedFetch` 工具函式
2. 移除所有 `apiCall` 相關程式碼
3. 完全統一為使用 SDK

---

## 檔案變更清單

### 已移除的檔案
- `src/lib/api/workflows.sdk.ts`
- `src/lib/api/tasks.sdk.ts`
- `src/lib/api/containers.sdk.ts`

### 已更新的檔案
- `src/lib/api/index.ts` - 簡化為只匯出 UI 輔助函式和必要的任務函式
- `src/lib/api.ts` - 工作流程 API 改為使用 SDK
- `src/contexts/AuthContext.tsx` - 已使用 SDK
- `src/pages/auth/LoginPage.tsx` - 已使用 SDK

---

## 結論

雖然成功移除了 SDK 包裝層檔案並簡化了 API 架構，但仍有一些 TypeScript 編譯問題需要解決。主要問題是某些函式匯出無法被 TypeScript 找到，可能需要進一步診斷模組解析問題。

建議後續步驟：
1. 先解決 TypeScript 編譯錯誤
2. 確保所有函式都能正確匯出和匯入
3. 然後再繼續遷移剩餘的組件直接使用 SDK
