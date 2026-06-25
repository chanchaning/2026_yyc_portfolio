import { Resend } from 'resend';

// 받는 사람 (문의가 도착할 메일함)
// 도메인 인증 전에는 Resend 계정 이메일(ducks0413@naver.com)로만 발송 가능
export const TO_EMAIL = 'ducks0413@naver.com';
// 보내는 사람 — 도메인 인증 전이면 onboarding@resend.dev 만 사용 가능
export const FROM_EMAIL = 'onboarding@resend.dev';

// HTML 인젝션 방지
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 문의 메일 발송. 성공 시 { status:200, body:{ ok:true, id } },
 * 실패 시 { status, body:{ error } } 형태로 반환.
 */
export async function sendContactEmail({ name, from, message }) {
  if (!process.env.RESEND_API_KEY) {
    return { status: 500, body: { error: '서버에 RESEND_API_KEY가 설정되지 않았습니다.' } };
  }
  if (!name || !name.trim()) {
    return { status: 400, body: { error: '이름을 입력해주세요.' } };
  }
  if (!from || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from.trim())) {
    return { status: 400, body: { error: '정상적인 이메일을 작성해주세요.' } };
  }
  if (!message || message.trim().length < 10) {
    return { status: 400, body: { error: '내용을 10글자 이상 작성해주세요.' } };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from: `Portfolio <${FROM_EMAIL}>`,
      to: TO_EMAIL,
      replyTo: from, // 답장하면 문의자에게 바로 회신됨
      subject: `[Portfolio] ${name}님의 메시지`,
      html: `
        <div style="font-family:sans-serif;line-height:1.6">
          <h2 style="margin:0 0 12px">새 문의가 도착했습니다</h2>
          <p><strong>보낸 사람:</strong> ${escapeHtml(name)}</p>
          <p><strong>회신 이메일:</strong> ${escapeHtml(from)}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
          <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return { status: 502, body: { error: error.message || '메일 발송에 실패했습니다.' } };
    }
    return { status: 200, body: { ok: true, id: data?.id } };
  } catch (err) {
    console.error('Send error:', err);
    return { status: 500, body: { error: '서버 오류가 발생했습니다.' } };
  }
}
