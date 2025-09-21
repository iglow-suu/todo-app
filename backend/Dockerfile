# Node.js 20の公式イメージを使用
FROM node:20-alpine

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール（開発依存関係も含む）
RUN npm ci

# アプリケーションのソースコードをコピー
COPY . .

# Prismaクライアントを生成
RUN npx prisma generate

# ポート3000を公開
EXPOSE 3000

# アプリケーションを起動
CMD ["npm", "run", "dev"]
