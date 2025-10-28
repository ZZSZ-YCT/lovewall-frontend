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

        const tokens = await open({
          title: 'GeeTest Verification',
          product: 'popup',
          riskType: 'login',
        })

        checkCancelled()

        const verify = await $fetch<{ success: boolean; error?: string }>('\/geetest\/validate', {
          method: 'POST',
          body: tokens,
        })

        if (!verify.success) {
          throw new Error(verify.error || 'failed with captcha')
        }

        println(`Attempting login with ${username}`)

        await auth.login({
          username: username,
          password: password,
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

  const config = useRuntimeConfig()
  const registerCaptchaId = (config.public as any).geeTestRegisterId as string | undefined

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
        println(`Term of Services: ${useRequestURL().origin}/tos_en`)
        println(`Privacy Policy: ${useRequestURL().origin}/privacy_en`)
        println()

        const choice = await promptInput('Agree? (Y/n):')
        if (choice.toLowerCase() == 'n' || choice.toLowerCase() == 'no') {
          println("Please agree to our terms to continue")
          return
        }

        const { open } = useCaptchaGate()

        const tokens = await open({
          title: 'GeeTest Verification',
          product: 'popup',
          riskType: 'login',
          captchaId: registerCaptchaId
        })

        checkCancelled()

        println(`Attempting register as ${username}`)

        await auth.register({
          username: username,
          password: password,
          lot_number: tokens.lot_number,
          captcha_output: tokens.captcha_output,
          pass_token: tokens.pass_token,
          gen_time: tokens.gen_time,
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
        const api = useApi()
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
