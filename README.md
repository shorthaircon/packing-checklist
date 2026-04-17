# 出國行李清單

一個用瀏覽器打開就能用的打包清單小網站。手機優先設計，資料存在瀏覽器本機，不需要登入、不需要後端。

## 功能

- 6 大預設分類（隨身物品、衣物、個人用品、飛機用品、一些 Extra、記得確認）。
- 點一下任何一列就能勾選 / 取消勾選。
- 頁首進度條顯示「已勾選 / 總數」。
- **編輯模式**（點頁首 ✏️）：
  - 新增 / 刪除 / 改名項目。
  - 新增 / 刪除 / 改名分類。
- **重設勾選**（點頁首 🔄）：一鍵清空勾選，但保留所有項目。
- 資料存 `localStorage`，同一台裝置、同一個瀏覽器下次打開時勾選狀態會保留。

## 本機預覽

最簡單的方式：直接雙擊 `index.html` 打開。

或啟動一個簡易 server（方便手機連同一個 Wi-Fi 測試）：

```bash
# Python 3
python -m http.server 8000

# 或 Node
npx serve .
```

打開 `http://localhost:8000`。

## 部署到 GitHub Pages

1. 在 GitHub 建立一個新的 Public repo（例：`packing-checklist`）。
2. 把這個資料夾內容推上去：
   ```bash
   git init
   git add .
   git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/<你的帳號>/packing-checklist.git
   git push -u origin main
   ```
3. 到 repo → **Settings** → **Pages**：
   - Source：`Deploy from a branch`
   - Branch：`main` / `/ (root)` → **Save**
4. 等 1–2 分鐘，GitHub 會給你一個網址：
   ```
   https://<你的帳號>.github.io/packing-checklist/
   ```
5. 在手機瀏覽器打開這個網址，可以「加入主畫面」當成 App 用。

## 檔案結構

```
packing_checklist/
├── index.html        # 頁面骨架
├── style.css         # 視覺樣式（手機優先）
├── app.js            # 互動邏輯、localStorage
├── default-data.js   # 預設清單內容（想改預設項目改這裡）
└── README.md
```

## 要換預設項目？

打開 `default-data.js`，照著現有格式改名字、加項目、換 emoji 即可。**注意**：預設資料只有在瀏覽器第一次打開時才會套用；之後打開都是讀 `localStorage`。要重新套用預設，可以在瀏覽器 DevTools 的 Console 執行：

```js
localStorage.removeItem("packing_checklist_v1"); location.reload();
```

## 資料會不會不見？

- 在同一台裝置、同一個瀏覽器下，資料會一直保留。
- 換裝置、換瀏覽器、清除瀏覽器資料 → 資料會消失並回到預設清單。
- 這是刻意設計：換個人用就是乾淨的初始狀態。
