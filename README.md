<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/80ef5bf5-2f6b-4446-b574-def719767785

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 交互状态规则

- 学员完成答题后，切换步骤或刷新页面时，已选答案和完成状态必须保持。
- 已保存的答题状态只能通过显式的重置操作清除。
- 已完成题目的按钮应保留原判断项文字，只将状态标记从 `[?]` 改为 `[v]`。
