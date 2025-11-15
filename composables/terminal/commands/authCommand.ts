import {z} from "zod";
import {promptInput, useCli} from '~/composables/terminal/useCli'

export function registerAuthCommands() {
  const auth = useAuthStore()
  const { register } = useCli()

  register({
    name: 'login',
    summary: 'Login into a account',
    args: [
      {name: 'username', type: 'string', required: true, description: 'username'},
    ],
    action: async ({ println, parsed, checkCancelled }) => {
      try {
        const [username] = parsed.argv as [string]
        println(`Username: ${username}`)

        const password = await promptInput('Password:', { mask: true })

        const { open } = useCaptchaGate()

        const result = await open({
          title: 'Security Verification',
        })

        checkCancelled()

        println(`Attempting login with ${username}`)

        await auth.login({
          username: username,
          password: password,
          captcha_id: result.captcha_id,
          captcha_data: result.captcha_data,
        })

        println(`Login successful, user: ${auth.currentUser?.username}`)
      } catch (e: any) {
        // If user pressed Ctrl+C while prompting
        if (e?.message === 'Interrupted') println('Login cancelled')
        else println(`Error: ${e?.message ?? String(e)}`)
      }
    }
  })

  const registerSchema = z.object({
    username: z.string()
      .min(3, 'At least 3 characters in username')
      .max(20, 'At most 20 characters in username')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contains letters, numbers, and underlines'),
    password: z.string()
      .min(6, 'At least 6 characters in password')
      .max(128, 'At most 128 characters in password'),
  })

  register({
    name: 'register',
    summary: 'Register into a account',
    args: [
      { name: 'username', type: 'string', description: 'username', required: true },
      { name: 'password', type: 'string', description: 'password', required: true },
    ],
    action: async ({ println, parsed, checkCancelled }) => {
      try {
        const [username, password] = parsed.argv as [string, string]

        registerSchema.parse({
          username: username,
          password: password,
        })

        println("Read our Term of Services and Privacy Policy:")
        println(`Term of Services: ${useRequestURL().origin}/tos`)
        println(`Privacy Policy: ${useRequestURL().origin}/privacy`)
        println()

        const choice = await promptInput('Agree? (Y/n):')
        if (choice.toLowerCase() == 'n' || choice.toLowerCase() == 'no') {
          println("Please agree to our terms to continue")
          return
        }

        const { open } = useCaptchaGate()

        const result = await open({
          title: 'Security Verification',
        })

        checkCancelled()

        println(`Attempting register as ${username}`)

        await auth.register({
          username: username,
          password: password,
          captcha_id: result.captcha_id,
          captcha_data: result.captcha_data,
        })

        println(`Registered successful, user: ${username}`)
      } catch (e : any) {
        println(`Error: ${e?.message ?? String(e)}`)
      }
    }
  })

  register({
    name: 'logout',
    summary: 'Logout account',
    action: async ({ println }) => {
      try {
        const api = useNuxtApp().$api
        await api.logout()
        println(`Logout successful`)
      } catch (e: any) {
        println(`Logout api called failed`)
      } finally {
        if (import.meta.client) {
          const { stopHeartbeat } = useHeartbeat()
          stopHeartbeat()
        }

        auth.currentUser = null
        auth.permissions = []
        auth.accessToken = null
        auth.error = null

        if (import.meta.client) {
          localStorage.removeItem('auth_token')
        }

        try {
          const cookies = useSessionCookies()
          cookies.clear()
        } catch {}
      }
    }
  })
}
