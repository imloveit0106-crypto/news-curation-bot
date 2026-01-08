'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI要約機能（Server Action）
 * Feature Flag実装: GEMINI_API_KEYの存在チェック
 */
export async function summarizeArticle(
  title: string,
  url: string
): Promise<{ success: boolean; summary?: string; error?: string }> {
  // Feature Flag: 環境変数チェック
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: 'AI機能は未設定です',
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `以下の記事タイトルについて、IT初心者向けに専門用語を補足しながら、3点の箇条書きで要約してください。

記事タイトル: ${title}
URL: ${url}

要約の条件:
- IT初心者でも理解できるように、専門用語は簡単に説明する
- 3つの箇条書きで簡潔にまとめる
- 各項目は1〜2文で構成する`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    return {
      success: true,
      summary,
    };
  } catch (error) {
    console.error('AI要約エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '要約の生成に失敗しました',
    };
  }
}
