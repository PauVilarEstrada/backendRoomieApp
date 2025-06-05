export function generateVerificationCode(length = 6): string {
  const letters = 'ABCDEFGHIJKLMNPQRSTUVWXYZ'
  const digits = '123456789'
  const charset = letters + digits

  let code = ''
  for (let i = 0; i < length; i++) {
    code += charset.charAt(Math.floor(Math.random() * charset.length))
  }

  return code
}
