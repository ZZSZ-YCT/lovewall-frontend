import {promptInput, useCli} from "~/composables/terminal/useCli";
import PhotoUploadDialog from "~/components/popup/PhotoUploadDialog.vue";

export function registerPostCommands() {
  const auth = useAuthStore()
  const {register} = useCli()
  const api = useNuxtApp().$api

  register({
    name: 'post',
    summary: 'Post commands',
    subcommands: [
      {
        name: 'list',
        summary: 'List recent posts',
        options: [
          {name: 'page', short: 'p', type: 'number', default: 1, description: 'page number'},
          {name: 'page-size', short: 's', type: 'number', default: 20, description: 'page size'},
        ],
        action: async ({println, parsed, kv}) => {
          const page = parsed.options.page
          const size = parsed.options.page_size

          if (size > 20) {
            println("Page size is less than 20")
            return
          }

          const posts = await api.listPosts({page: page, page_size: size})
          const items = posts.items

          const result: string[] = []

          result.push(`List of ${posts.total} posts:`)

          println("Loading data...")

          for (let i = 0; i < posts.total; i++) {
            const post = items[i]
            const author_user_data = await api.getUser(post.author_id)
            const name = post.author_name +
              (post.author_tag ? `[${post.author_tag.title}]` : "") +
              (author_user_data.display_name == post.author_name ? "" : "(custom)")
            const target = (post.card_type == 'confession' ? ` -> ${post.target_name}` : "")
            const content = post.content.slice(0, 10) + (post.content.length > 10 ? "..." : "")
            result.push(`${i} - ${name}${target} : ${content}`)

            kv.set(`POST_LIST_ID_${i}`, post.id)
          }

          result.forEach((element) => {
            println(element)
          })
        }
      },
      {
        name: 'check',
        summary: 'Check one post',
        args: [
          {name: 'id', type: 'string', required: true, description: 'The number ID or UUID'},
        ],
        action: async ({println, parsed, kv}) => {
          const [id] = parsed.argv
          const uid = /^\d+$/.test(id!!) ? kv.get(`POST_LIST_${id}`) : id!!

          println('Loading data...')

          const post = await api.getPost(uid)

          println(`Post ${uid}`)
          println(`Created at ${post.created_at}`)
          println(`Last updated at ${post.updated_at}`)
          println(`Author: ${post.author_name}`)
          if (post.author_tag) {
            println(`Author Tag: ${post.author_tag.title}`)
          }
          println(`Card Type: ${post.card_type}`)
          if (post.card_type == 'confession') {
            println(`Target: ${post.target_name}`)
          }
          println(`Content: ${post.content}`)
        }
      },
      {
        name: 'new',
        summary: 'Create a new post',
        action: async ({println, clear, popLine}) => {
          let formData: FormData

          while (true) {
            clear()
            println("---Post Builder---")

            const data = new FormData()

            const author_name = await promptInput('Custom Author Name(empty to use your name):')

            if (author_name != '') {
              data.append('confessor_mode', 'custom')
              data.append('author_name', author_name)
            }

            const type = (await promptInput('Post Type(Confession/social):')).toLowerCase() == 'social' ? 'social' : 'confession'
            const target_name = type == 'confession' ? await promptInput('Confession Target Name:') : ''

            data.append('card_type', type)
            if (type === 'confession') {
              data.append('target_name', target_name)
            }

            const end = await promptInput('Are you sure about everything? (Y/n)')

            if (end.toLowerCase() != 'n' && end.toLowerCase() != 'no') {
              formData = data
              break
            }
          }

          clear()
          println("---Post Builder---")
          println("Edit the post content here:")
          println("'!finish' to finish editing, '!pop' to remove the last paragraph. (double '!' if you want to type '!finish' or '!pop')")
          println("---Content Editor---")

          const content: string[] = []

          while (true) {
            const input = await promptInput("")

            if (input.toLowerCase() == '!finish') {
              break
            } else if (input.toLowerCase() == '!pop') {
              if (content.length >= 1) {
                content.pop()
                popLine()
                popLine()
              }
            } else {
              let vi = input
              if (input === '!!finish') {
                vi = '!finish'
              }
              if (input === '!!pop') {
                vi = '!pop'
              }

              content.push(vi)
            }
          }

          const s_content = content.join('\n')

          formData.append('content', s_content)

          clear()
          println("---Post Builder---")
          const choice = await promptInput("Do you want to upload photos? (y/N)")
          if (choice.toLowerCase() == 'y' || choice.toLowerCase() == 'yes') {
            const {open} = usePopupPortal()

            try {
              const files: File[] = await open({
                title: 'Upload photos',
                component: PhotoUploadDialog,
                cancelAsResolve: true,
                cancelPayload: []
              })

              files.forEach((file: File) => {
                formData.append('images', file)
              })
            } catch (e: any) {
              println(`Error: ${e?.message ?? 'cancelled'}`)
            }
          }

          await api.createPost(formData)

          println(`Created successfully.`)
        }
      }
    ]
  })
}
