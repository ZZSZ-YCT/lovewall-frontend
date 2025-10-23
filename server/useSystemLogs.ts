import { ref } from 'vue'
import type { LogEntry, Pagination } from "~/types";

export const logsData = ref<Pagination<LogEntry> | null>(null)
export const activeLogType = ref<'submissions' | 'operations'>('submissions')
