import {useCli} from "~/composables/terminal/useCli";
import type {UpdateProfileForm} from "~/types";
import EditAvatarDialog from "~/components/popup/EditAvatarDialog.vue";

const { register } = useCli()

export function registerUserCommands() {
  const auth = useAuthStore()

  register({
    name: 'whoami',
    summary: 'Whoami terminal, returns username\\display_name\\permission',
    action: ({ println }) => {
      if(!auth.isAuthenticated) {
        println('logout\\anonymous\\undefined')
        return
      }

      let username = auth.currentUser!!.username
      let display = auth.userDisplayName
      let permission = "user"

      if (auth.isSuperadmin) {
        permission = "root"
      } else if (auth.currentUser!!.is_admin) {
        permission = "admin"
      }

      println(`${username}\\${display}\\${permission}`)
    }
  })

  const api = useNuxtApp().$api

  register({
    name: 'my',
    summary: 'Manage users',
    subcommands: [
      {
        name: 'password',
        summary: 'Change the password',
        alias: ['cp'],
        args: [
          { name: 'old', type: 'string', required: true, description: 'old password' },
          { name: 'new', type: 'string', required: true, description: 'new password' },
        ],
        action: async ({ println, parsed }) => {
          const [old_password, new_password] = parsed.argv as [string, string]

          println("Attempting to change password")

          await api.changePassword({
            old_password: old_password,
            new_password: new_password,
            confirm_password: new_password
          })

          println("Change successful")
        }
      },
      {
        name: 'profile',
        summary: 'Show or modify profile',
        options: [
          { name: 'nickname', short: 'n', type: 'varstring', description: 'Your display name' },
          { name: 'email', short: 'e', type: 'varstring', description: 'Your email address' },
          { name: 'phone', short: 'p', type: 'varstring', description: 'Your phone number' },
          { name: 'bio', short: 'b', type: 'varstring', description: 'Your bio' },
        ],
        action: async ({ println, parsed }) => {
          const opts = parsed.options

          if(!auth.isAuthenticated) {
            throw Error('missing token')
          }

          const updateData: UpdateProfileForm = {}

          if ('nickname' in opts) updateData.display_name = opts.nickname === true ? '' : opts.nickname || ''
          if ('email' in opts) updateData.email = opts.email === true ? '' : opts.email || ''
          if ('phone' in opts) updateData.phone = opts.phone === true ? '' : opts.phone || ''
          if ('bio' in opts) updateData.bio = opts.bio === true ? '' : opts.bio || ''

          if (Object.keys(updateData).length === 0) {
            println(`Display Name: ${auth.currentUser!!.display_name || null}`)
            println(`E-Mail: ${auth.currentUser!!.email || null}`)
            println(`Phone Number: ${auth.currentUser!!.phone || null}`)
            println(`Biography: ${auth.currentUser!!.bio || null}`)

            println(`'my profile -h' to see the modification usage`)
            return
          }

          console.log('[userCommand] updateData:', updateData)

          const updatedUser = await api.updateProfile(updateData)

          auth.setCurrentUser(updatedUser)

          println('Change successful')
        }
      },
      {
        name: 'avatar',
        summary: 'Show or modify avatar',
        action: async ({ println, checkCancelled }) => {
          if(!auth.isAuthenticated) {
            throw Error('missing token')
          }

          const avatarUrl = useAssetUrl().assetUrl(auth.currentUser!!.avatar_url)

          const { open } = usePopupPortal()
          try {
            const file: File = await open({
              title: 'Edit avatar',
              component: EditAvatarDialog,
              props: {
                currentUrl: avatarUrl,
                outputSize: 512
              },
            })

            checkCancelled()

            let form : UpdateProfileForm = {}
            form.avatar = file

            const updatedUser = await api.updateProfile(form)

            auth.setCurrentUser(updatedUser)

            println("Change successful")
          } catch (e: any) {
            println(`Error: ${e?.message ?? 'cancelled'}`)
          }
        }
      }
    ]
  })
}
