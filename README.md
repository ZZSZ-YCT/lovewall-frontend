# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## 验证码系统

- 前端组件：`components/security/CaptchaWidget.vue` - 通用验证码组件,支持三种类型:
  - `click` - 点选验证(按顺序点击指定字符)
  - `slide` - 滑块验证(拖动拼图到正确位置)
  - `rotate` - 旋转验证(旋转图片到正确角度)
- API 接口：后端提供 `GET /api/captcha/generate` 接口生成验证码
- 集成位置：登录/注册页面和 Terminal 命令行界面均已集成
- 特性：
  - 60 秒有效期,过期自动刷新
  - 一次性验证,失败后自动重新生成
  - 支持触摸和鼠标操作
  - Base64 图片编码,无需额外资源请求
