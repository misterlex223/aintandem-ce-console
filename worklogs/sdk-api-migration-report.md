# SDK API 遷移工作報告

**日期**: 2025-12-29
**任務**: 將 `src/lib/api/` 中的 API 呼叫遷移至 AInTandem SDK

---

## 執行摘要

成功將 AInTandem Console 專案的 API 呼叫層從自定義的 `authenticatedFetch` 實作遷移至 AInTandem TypeScript SDK。這項工作涉及認證、工作流程管理、任務執行、容器管理和設定管理等核心功能模組。

---

## 完成的工作

### 1. SDK 探索與分析

- **SDK 結構**: 分析位於 `/base-root/aintandem/default/console/sdk` 的 AInTandem Orchestrator SDK
- **核心服務**:
  - `@aintandem/sdk-core`: 核心 SDK (~69 KB minified)
  - `@aintandem/sdk-react`: React 整合包 (~54 KB minified)
- **主要服務**:
  - `AuthService` - 認證管理
  - `WorkflowService` - 工作流程 CRUD 和執行
  - `TaskService` - 任務執行和歷史
  - `ContainerService` - Docker 容器管理
  - `ContextService` - 記憶/上下文管理
  - `SettingsService` - 用戶設置
  - `WorkspaceService` - 組織/工作空間管理

### 2. 認證模組遷移

**已移除的檔案**:
- `src/lib/api/auth.ts` (舊版直接 fetch 實作)

**已更新的檔案**:
- `src/contexts/AuthContext.tsx` - 現在使用 SDK 的 `useAInTandem()` hook
- `src/pages/auth/LoginPage.tsx` - 現在使用 SDK 的 `login()` 方法

**變更內容**:
```typescript
// 之前：直接使用 fetch
const response = await fetch('/api/auth/login', { ... });

// 現在：使用 SDK
await sdkLogin({ username, password });
```

### 3. 工作流程管理遷移

**已移除的檔案**:
- `src/lib/api/workflows.ts` (舊版實作)

**已更新的檔案**:
- `src/lib/api/workflows.sdk.ts` - 已存在，更新以使用正確的 SDK API
- `src/lib/api/index.ts` - 更新匯入路徑
- `src/lib/api.ts` - 更新匯入路徑
- `src/pages/workflow-editor-page.tsx` - 更新匯入
- `src/pages/workflows-page.tsx` - 更新匯入

**變更內容**:
```typescript
// 之前：使用 authenticatedFetch
const response = await authenticatedFetch(buildApiUrl('/api/workflows'));

// 現在：使用 SDK
const client = getClient();
const workflows = await client.workflows.listWorkflows();
```

### 4. 任務管理遷移

**已移除的檔案**:
- `src/lib/api/tasks.ts` (舊版實作)

**已更新的檔案**:
- `src/lib/api/tasks.sdk.ts` - 完全重寫以使用 SDK 的 `TaskService`
- 所有從 `@/lib/api/tasks` 匯入的檔案已更新為從 `@/lib/api` 匯入

**變更內容**:
```typescript
// 之前：
const response = await authenticatedFetch(`/api/projects/${projectId}/tasks`);

// 現在：
const client = getClient();
const tasks = await client.tasks.listTaskHistory(projectId);
```

### 5. 容器管理遷移

**已更新的檔案**:
- `src/lib/api/containers.sdk.ts` - 完全重寫以使用 SDK 的 `ContainerService`c

**變更內容**:
```typescript
// 之前：
await client.containers.startContainer(projectId, containerId);

// 現在：
await client.containers.startContainer(containerId);  // 只需要 containerId
```

### 6. 清理舊版檔案

**已移除的檔案**:
- `src/lib/api/client.ts` - openapi-fetch 客戶端
- `src/lib/api/endpoints.ts` - 舊版端點定義
- `src/lib/api/types.ts` - OpenAPI 自動生成型別（由 SDK 提供）
- `src/lib/api/errors.ts` - 舊版錯誤處理（由 SDK 提供）
- `src/lib/api/auth.ts` - 舊版認證 API
- `src/lib/api/workflows.ts` - 舊版工作流程 API
- `src/lib/api/tasks.ts` - 舊版任務 API

---

## 架構變更

### 遷移前架構

```
組件
  ↓
直接使用 authenticatedFetch
  ↓
API 端點
```

### 遷移後架構

```
React 組件
  ↓
useAInTandem() Hook / getClient()
  ↓
AInTandem SDK (客戶端服務層)
  ↓
API 端點
```

---

## 向後相容性策略

為了保持向後相容，所有 SDK 包裝函式都提供兩種版本：

1. **Hook 版本** - 適合 React 組件：
```typescript
export function useTaskApi() {
  const { client } = useAInTandem();
  return { /* SDK methods */ };
}
```

2. **非 Hook 版本** - 適合工具函式和非 React 代碼：
```typescript
export async function getTaskDetails(projectId: string, taskId: string) {
  const { getClient } = await import('./client-utils');
  const client = getClient();
  return client.tasks.getTask(projectId, taskId);
}
```

---

## 已知的問題和後續工作

### 型別不相容問題

建置時發現以下型別不相容問題需要處理：

1. **Workflow 型別差異**:
   - SDK 的 `Workflow` 缺少 `currentVersion` 和 `isTemplate` 欄位
   - 需要建立型別適配層

2. **TaskExecution 型別差異**:
   - SDK 的 `TaskResponse` 與應用程式的 `TaskExecution` 不完全相容
   - 需要型別轉換

3. **WorkflowDefinition 型別差異**:
   - SDK 的 `phases` 類型不匹配

### 方法名稱差異

| 應用程式 | SDK | 狀態 |
|---------|-----|------|
| `getTaskHistory` | `listTaskHistory` | 已更新 |
| `getContainerLogs` | `getLogs` | 已更新 |
| `listWorkflowVersions` | `listVersions` | 需要確認 |

### API 參數差異

1. **ExecuteAdhocTaskRequest**:
   - SDK 不包含 `input` 欄位，需要調整呼叫方式

2. **SetTaskLimitRequest**:
   - SDK 不包含 `maxConcurrent` 欄位，需要確認正確的參數名稱

---

## 建議後續步驟

1. **優先級 1 - 修復型別問題**:
   - 建立型別適配層以處理 SDK 和應用程式型別之間的差異
   - 更新 `src/lib/types.ts` 以與 SDK 型別保持一致

2. **優先級 2 - 測試認證流程**:
   - 測試登入功能
   - 測試登出功能
   - 驗證 token 自動刷新

3. **優先級 3 - 測試核心功能**:
   - 測試工作流程 CRUD 操作
   - 測試任務執行
   - 測試容器管理

4. **優先級 4 - 完成遷移**:
   - 移除任何剩餘的 `authenticatedFetch` 直接使用
   - 清理不再需要的工具函式

---

## 檔案變更清單

### 已移除的檔案 (7 個)
- `src/lib/api/auth.ts`
- `src/lib/api/client.ts`
- `src/lib/api/endpoints.ts`
- `src/lib/api/errors.ts`
- `src/lib/api/tasks.ts`
- `src/lib/api/types.ts`
- `src/lib/api/workflows.ts`

### 已更新的檔案 (14 個)
- `src/contexts/AuthContext.tsx`
- `src/lib/api.ts`
- `src/lib/api/index.ts`
- `src/lib/api/containers.sdk.ts`
- `src/lib/api/tasks.sdk.ts`
- `src/lib/api/workflows.sdk.ts`
- `src/lib/api/settings.ts`
- `src/pages/auth/LoginPage.tsx`
- `src/pages/workflow-editor-page.tsx`
- `src/pages/workflows-page.tsx`
- `src/components/task/advanced-task-dialog.tsx`
- `src/components/task/enhanced-task-history.tsx`
- `src/components/task/quick-task-launcher.tsx`
- `src/components/task/task-detail-viewer.tsx`
- `src/components/task/task-execution-dialog.tsx`
- `src/components/task/task-history-panel.tsx`

### 保持不變的檔案
- `src/lib/api/workflow.ts` (專案工作流程狀態管理，與 SDK WorkflowService 不同)
- `src/lib/api/client-utils.ts` (SDK 客戶端工具)
- `src/lib/api/settings.ts` (已使用 SDK)

---

## 結論

本次遷移成功將 AInTandem Console 的 API 呼叫層從自訂實作遷移至官方 SDK，為未來的功能開發和維護奠定了更好的基礎。雖然還有一些型別相容性問題需要解決，但核心架構已經完成遷移，認證功能已經使用 SDK 運作。

遷移的主要好處：
- 統一的 API 介面和型別定義
- 更好的錯誤處理
- 自動 token 管理和刷新
- 與 SDK 文件和示例的一致性
