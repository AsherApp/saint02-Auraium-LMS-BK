import React from 'react'
import { getIcon, hasIcon, type IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'

interface IconProps {
  name: IconName
  className?: string
  size?: number | string
  color?: string
  strokeWidth?: number
  fill?: string
  onClick?: () => void
  'aria-label'?: string
  'aria-hidden'?: boolean
}

export const Icon: React.FC<IconProps> = ({
  name,
  className,
  size = 16,
  color,
  strokeWidth = 2,
  fill,
  onClick,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden = false,
  ...props
}) => {
  const IconComponent = getIcon(name)
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in registry`)
    return null
  }

  const iconProps = {
    size,
    color,
    strokeWidth,
    fill,
    className: cn('inline-block', className),
    onClick,
    'aria-label': ariaLabel,
    'aria-hidden': ariaHidden,
    ...props,
  }

  return <IconComponent {...iconProps} />
}

// Convenience components for common icons
export const HomeIcon = (props: Omit<IconProps, 'name'>) => <Icon name="home" {...props} />
export const MenuIcon = (props: Omit<IconProps, 'name'>) => <Icon name="menu" {...props} />
export const XIcon = (props: Omit<IconProps, 'name'>) => <Icon name="x" {...props} />
export const PlusIcon = (props: Omit<IconProps, 'name'>) => <Icon name="plus" {...props} />
export const EditIcon = (props: Omit<IconProps, 'name'>) => <Icon name="edit" {...props} />
export const TrashIcon = (props: Omit<IconProps, 'name'>) => <Icon name="trash" {...props} />
export const CopyIcon = (props: Omit<IconProps, 'name'>) => <Icon name="copy" {...props} />
export const DownloadIcon = (props: Omit<IconProps, 'name'>) => <Icon name="download" {...props} />
export const UploadIcon = (props: Omit<IconProps, 'name'>) => <Icon name="upload" {...props} />
export const SearchIcon = (props: Omit<IconProps, 'name'>) => <Icon name="search" {...props} />
export const SettingsIcon = (props: Omit<IconProps, 'name'>) => <Icon name="settings" {...props} />
export const CheckIcon = (props: Omit<IconProps, 'name'>) => <Icon name="check" {...props} />
export const XCircleIcon = (props: Omit<IconProps, 'name'>) => <Icon name="x-circle" {...props} />
export const AlertTriangleIcon = (props: Omit<IconProps, 'name'>) => <Icon name="alert-triangle" {...props} />
export const UserIcon = (props: Omit<IconProps, 'name'>) => <Icon name="user" {...props} />
export const UsersIcon = (props: Omit<IconProps, 'name'>) => <Icon name="users" {...props} />
export const FileTextIcon = (props: Omit<IconProps, 'name'>) => <Icon name="file-text" {...props} />
export const BookOpenIcon = (props: Omit<IconProps, 'name'>) => <Icon name="book-open" {...props} />
export const MessageSquareIcon = (props: Omit<IconProps, 'name'>) => <Icon name="message-square" {...props} />
export const CalendarIcon = (props: Omit<IconProps, 'name'>) => <Icon name="calendar" {...props} />
export const ClockIcon = (props: Omit<IconProps, 'name'>) => <Icon name="clock" {...props} />
export const PlayIcon = (props: Omit<IconProps, 'name'>) => <Icon name="play" {...props} />
export const PauseIcon = (props: Omit<IconProps, 'name'>) => <Icon name="pause" {...props} />
export const VideoIcon = (props: Omit<IconProps, 'name'>) => <Icon name="video" {...props} />
export const GraduationCapIcon = (props: Omit<IconProps, 'name'>) => <Icon name="graduation-cap" {...props} />
export const AwardIcon = (props: Omit<IconProps, 'name'>) => <Icon name="award" {...props} />
export const StarIcon = (props: Omit<IconProps, 'name'>) => <Icon name="star" {...props} />
export const BarChartIcon = (props: Omit<IconProps, 'name'>) => <Icon name="bar-chart" {...props} />
export const TrendingUpIcon = (props: Omit<IconProps, 'name'>) => <Icon name="trending-up" {...props} />
export const ActivityIcon = (props: Omit<IconProps, 'name'>) => <Icon name="activity" {...props} />
export const EyeIcon = (props: Omit<IconProps, 'name'>) => <Icon name="eye" {...props} />
export const EyeOffIcon = (props: Omit<IconProps, 'name'>) => <Icon name="eye-off" {...props} />
export const HeartIcon = (props: Omit<IconProps, 'name'>) => <Icon name="heart" {...props} />
export const ThumbsUpIcon = (props: Omit<IconProps, 'name'>) => <Icon name="thumbs-up" {...props} />
export const ThumbsDownIcon = (props: Omit<IconProps, 'name'>) => <Icon name="thumbs-down" {...props} />
export const FlagIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag" {...props} />
export const BookmarkIcon = (props: Omit<IconProps, 'name'>) => <Icon name="bookmark" {...props} />
export const TagIcon = (props: Omit<IconProps, 'name'>) => <Icon name="tag" {...props} />
export const TagsIcon = (props: Omit<IconProps, 'name'>) => <Icon name="tags" {...props} />
export const CheckSquareIcon = (props: Omit<IconProps, 'name'>) => <Icon name="check-square" {...props} />
export const SquareIcon = (props: Omit<IconProps, 'name'>) => <Icon name="square" {...props} />
export const CircleIcon = (props: Omit<IconProps, 'name'>) => <Icon name="circle" {...props} />
export const RadioIcon = (props: Omit<IconProps, 'name'>) => <Icon name="radio" {...props} />
export const ToggleLeftIcon = (props: Omit<IconProps, 'name'>) => <Icon name="toggle-left" {...props} />
export const ToggleRightIcon = (props: Omit<IconProps, 'name'>) => <Icon name="toggle-right" {...props} />
export const GridIcon = (props: Omit<IconProps, 'name'>) => <Icon name="grid" {...props} />
export const ListIcon = (props: Omit<IconProps, 'name'>) => <Icon name="list" {...props} />
export const LayoutIcon = (props: Omit<IconProps, 'name'>) => <Icon name="layout" {...props} />
export const SidebarIcon = (props: Omit<IconProps, 'name'>) => <Icon name="sidebar" {...props} />
export const PanelLeftIcon = (props: Omit<IconProps, 'name'>) => <Icon name="panel-left" {...props} />
export const PanelRightIcon = (props: Omit<IconProps, 'name'>) => <Icon name="panel-right" {...props} />
export const WrenchIcon = (props: Omit<IconProps, 'name'>) => <Icon name="wrench" {...props} />
export const HammerIcon = (props: Omit<IconProps, 'name'>) => <Icon name="hammer" {...props} />
export const ScissorsIcon = (props: Omit<IconProps, 'name'>) => <Icon name="scissors" {...props} />
export const PaletteIcon = (props: Omit<IconProps, 'name'>) => <Icon name="palette" {...props} />
export const BrushIcon = (props: Omit<IconProps, 'name'>) => <Icon name="brush" {...props} />
export const WandIcon = (props: Omit<IconProps, 'name'>) => <Icon name="wand" {...props} />
export const SunIcon = (props: Omit<IconProps, 'name'>) => <Icon name="sun" {...props} />
export const MoonIcon = (props: Omit<IconProps, 'name'>) => <Icon name="moon" {...props} />
export const CloudIcon = (props: Omit<IconProps, 'name'>) => <Icon name="cloud" {...props} />
export const CloudRainIcon = (props: Omit<IconProps, 'name'>) => <Icon name="cloud-rain" {...props} />
export const CloudSnowIcon = (props: Omit<IconProps, 'name'>) => <Icon name="cloud-snow" {...props} />
export const WindIcon = (props: Omit<IconProps, 'name'>) => <Icon name="wind" {...props} />
export const DollarSignIcon = (props: Omit<IconProps, 'name'>) => <Icon name="dollar-sign" {...props} />
export const CreditCardIcon = (props: Omit<IconProps, 'name'>) => <Icon name="credit-card" {...props} />
export const ReceiptIcon = (props: Omit<IconProps, 'name'>) => <Icon name="receipt" {...props} />
export const ShoppingCartIcon = (props: Omit<IconProps, 'name'>) => <Icon name="shopping-cart" {...props} />
export const PackageIcon = (props: Omit<IconProps, 'name'>) => <Icon name="package" {...props} />
export const TruckIcon = (props: Omit<IconProps, 'name'>) => <Icon name="truck" {...props} />
export const ShieldIcon = (props: Omit<IconProps, 'name'>) => <Icon name="shield" {...props} />
export const ShieldCheckIcon = (props: Omit<IconProps, 'name'>) => <Icon name="shield-check" {...props} />
export const ShieldAlertIcon = (props: Omit<IconProps, 'name'>) => <Icon name="shield-alert" {...props} />
export const KeyIcon = (props: Omit<IconProps, 'name'>) => <Icon name="key" {...props} />
export const FingerprintIcon = (props: Omit<IconProps, 'name'>) => <Icon name="fingerprint" {...props} />
export const CodeIcon = (props: Omit<IconProps, 'name'>) => <Icon name="code" {...props} />
export const TerminalIcon = (props: Omit<IconProps, 'name'>) => <Icon name="terminal" {...props} />
export const GitBranchIcon = (props: Omit<IconProps, 'name'>) => <Icon name="git-branch" {...props} />
export const GitCommitIcon = (props: Omit<IconProps, 'name'>) => <Icon name="git-commit" {...props} />
export const GitMergeIcon = (props: Omit<IconProps, 'name'>) => <Icon name="git-merge" {...props} />
export const GitPullRequestIcon = (props: Omit<IconProps, 'name'>) => <Icon name="git-pull-request" {...props} />
export const FacebookIcon = (props: Omit<IconProps, 'name'>) => <Icon name="facebook" {...props} />
export const TwitterIcon = (props: Omit<IconProps, 'name'>) => <Icon name="twitter" {...props} />
export const InstagramIcon = (props: Omit<IconProps, 'name'>) => <Icon name="instagram" {...props} />
export const LinkedinIcon = (props: Omit<IconProps, 'name'>) => <Icon name="linkedin" {...props} />
export const GithubIcon = (props: Omit<IconProps, 'name'>) => <Icon name="github" {...props} />
export const YoutubeIcon = (props: Omit<IconProps, 'name'>) => <Icon name="youtube" {...props} />
export const HelpCircleIcon = (props: Omit<IconProps, 'name'>) => <Icon name="help-circle" {...props} />
export const QuestionMarkCircleIcon = (props: Omit<IconProps, 'name'>) => <Icon name="question-mark-circle" {...props} />
export const AlertCircleIcon = (props: Omit<IconProps, 'name'>) => <Icon name="alert-circle" {...props} />
export const BellIcon = (props: Omit<IconProps, 'name'>) => <Icon name="bell" {...props} />
export const BellOffIcon = (props: Omit<IconProps, 'name'>) => <Icon name="bell-off" {...props} />
export const Volume1Icon = (props: Omit<IconProps, 'name'>) => <Icon name="volume-1" {...props} />
export const VolumeHighIcon = (props: Omit<IconProps, 'name'>) => <Icon name="volume-high" {...props} />
export const VolumeMuteIcon = (props: Omit<IconProps, 'name'>) => <Icon name="volume-mute" {...props} />
export const MaximizeIcon = (props: Omit<IconProps, 'name'>) => <Icon name="maximize" {...props} />
export const MinimizeIcon = (props: Omit<IconProps, 'name'>) => <Icon name="minimize" {...props} />
export const RotateCcwIcon = (props: Omit<IconProps, 'name'>) => <Icon name="rotate-ccw" {...props} />
export const RotateCwIcon = (props: Omit<IconProps, 'name'>) => <Icon name="rotate-cw" {...props} />
export const RefreshCwIcon = (props: Omit<IconProps, 'name'>) => <Icon name="refresh-cw" {...props} />
export const RefreshCcwIcon = (props: Omit<IconProps, 'name'>) => <Icon name="refresh-ccw" {...props} />
export const RepeatIcon = (props: Omit<IconProps, 'name'>) => <Icon name="repeat" {...props} />
export const ShuffleIcon = (props: Omit<IconProps, 'name'>) => <Icon name="shuffle" {...props} />
export const SkipBackIcon = (props: Omit<IconProps, 'name'>) => <Icon name="skip-back" {...props} />
export const SkipForwardIcon = (props: Omit<IconProps, 'name'>) => <Icon name="skip-forward" {...props} />
export const FastForwardIcon = (props: Omit<IconProps, 'name'>) => <Icon name="fast-forward" {...props} />
export const RewindIcon = (props: Omit<IconProps, 'name'>) => <Icon name="rewind" {...props} />
export const PauseCircleIcon = (props: Omit<IconProps, 'name'>) => <Icon name="pause-circle" {...props} />
export const PlayCircleIcon = (props: Omit<IconProps, 'name'>) => <Icon name="play-circle" {...props} />
export const StopCircleIcon = (props: Omit<IconProps, 'name'>) => <Icon name="stop-circle" {...props} />
export const SquareIconComponent = (props: Omit<IconProps, 'name'>) => <Icon name="square-icon" {...props} />
export const CircleIconComponent = (props: Omit<IconProps, 'name'>) => <Icon name="circle-icon" {...props} />
export const TriangleIcon = (props: Omit<IconProps, 'name'>) => <Icon name="triangle" {...props} />
export const HexagonIcon = (props: Omit<IconProps, 'name'>) => <Icon name="hexagon" {...props} />
export const OctagonIcon = (props: Omit<IconProps, 'name'>) => <Icon name="octagon" {...props} />
export const PentagonIcon = (props: Omit<IconProps, 'name'>) => <Icon name="pentagon" {...props} />
export const DiamondIcon = (props: Omit<IconProps, 'name'>) => <Icon name="diamond" {...props} />
export const HeartIconComponent = (props: Omit<IconProps, 'name'>) => <Icon name="heart-icon" {...props} />
export const SmileIcon = (props: Omit<IconProps, 'name'>) => <Icon name="smile" {...props} />
export const FrownIcon = (props: Omit<IconProps, 'name'>) => <Icon name="frown" {...props} />
export const MehIcon = (props: Omit<IconProps, 'name'>) => <Icon name="meh" {...props} />
export const LaughIcon = (props: Omit<IconProps, 'name'>) => <Icon name="laugh" {...props} />
export const AngryIcon = (props: Omit<IconProps, 'name'>) => <Icon name="angry" {...props} />
export const SurprisedIcon = (props: Omit<IconProps, 'name'>) => <Icon name="surprised" {...props} />
export const ConfusedIcon = (props: Omit<IconProps, 'name'>) => <Icon name="confused" {...props} />
export const WinkIcon = (props: Omit<IconProps, 'name'>) => <Icon name="wink" {...props} />
export const TongueIcon = (props: Omit<IconProps, 'name'>) => <Icon name="tongue" {...props} />
export const KissIcon = (props: Omit<IconProps, 'name'>) => <Icon name="kiss" {...props} />
export const HugIcon = (props: Omit<IconProps, 'name'>) => <Icon name="hug" {...props} />
export const ThumbUpIcon = (props: Omit<IconProps, 'name'>) => <Icon name="thumb-up" {...props} />
export const ThumbDownIcon = (props: Omit<IconProps, 'name'>) => <Icon name="thumb-down" {...props} />
export const HandIcon = (props: Omit<IconProps, 'name'>) => <Icon name="hand" {...props} />
export const HandshakeIcon = (props: Omit<IconProps, 'name'>) => <Icon name="handshake" {...props} />
export const PeaceIcon = (props: Omit<IconProps, 'name'>) => <Icon name="peace" {...props} />
export const VictoryIcon = (props: Omit<IconProps, 'name'>) => <Icon name="victory" {...props} />
export const ClapIcon = (props: Omit<IconProps, 'name'>) => <Icon name="clap" {...props} />
export const WaveIcon = (props: Omit<IconProps, 'name'>) => <Icon name="wave" {...props} />
export const PointIcon = (props: Omit<IconProps, 'name'>) => <Icon name="point" {...props} />
export const GrabIcon = (props: Omit<IconProps, 'name'>) => <Icon name="grab" {...props} />
export const PinchIcon = (props: Omit<IconProps, 'name'>) => <Icon name="pinch" {...props} />
export const PinIcon = (props: Omit<IconProps, 'name'>) => <Icon name="pin" {...props} />
export const MapPinIcon = (props: Omit<IconProps, 'name'>) => <Icon name="map-pin" {...props} />
export const NavigationIcon = (props: Omit<IconProps, 'name'>) => <Icon name="navigation" {...props} />
export const CompassIcon = (props: Omit<IconProps, 'name'>) => <Icon name="compass" {...props} />
export const GlobeIcon = (props: Omit<IconProps, 'name'>) => <Icon name="globe" {...props} />
export const MapIcon = (props: Omit<IconProps, 'name'>) => <Icon name="map" {...props} />
export const MapPinnedIcon = (props: Omit<IconProps, 'name'>) => <Icon name="map-pinned" {...props} />
export const RouteIcon = (props: Omit<IconProps, 'name'>) => <Icon name="route" {...props} />
export const SignpostIcon = (props: Omit<IconProps, 'name'>) => <Icon name="signpost" {...props} />
export const FlagIconComponent = (props: Omit<IconProps, 'name'>) => <Icon name="flag-icon" {...props} />
export const FlagTriangleLeftIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-triangle-left" {...props} />
export const FlagTriangleRightIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-triangle-right" {...props} />
export const FlagCheckeredIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-checkered" {...props} />
export const FlagOffIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-off" {...props} />
export const FlagPoleIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-pole" {...props} />
export const FlagSwissIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-swiss" {...props} />
export const FlagUkIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-uk" {...props} />
export const FlagUsIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-us" {...props} />
export const FlagCaIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-ca" {...props} />
export const FlagFrIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-fr" {...props} />
export const FlagDeIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-de" {...props} />
export const FlagItIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-it" {...props} />
export const FlagEsIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-es" {...props} />
export const FlagJpIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-jp" {...props} />
export const FlagKrIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-kr" {...props} />
export const FlagCnIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-cn" {...props} />
export const FlagInIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-in" {...props} />
export const FlagBrIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-br" {...props} />
export const FlagAuIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-au" {...props} />
export const FlagNzIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-nz" {...props} />
export const FlagMxIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-mx" {...props} />
export const FlagRuIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-ru" {...props} />
export const FlagSaIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-sa" {...props} />
export const FlagAeIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-ae" {...props} />
export const FlagEgIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-eg" {...props} />
export const FlagZaIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-za" {...props} />
export const FlagNgIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-ng" {...props} />
export const FlagKeIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-ke" {...props} />
export const FlagGhIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-gh" {...props} />
export const FlagMaIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-ma" {...props} />
export const FlagTzIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-tz" {...props} />
export const FlagUgIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-ug" {...props} />
export const FlagZwIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-zw" {...props} />
export const FlagBwIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-bw" {...props} />
export const FlagMzIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-mz" {...props} />
export const FlagMwIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-mw" {...props} />
export const FlagZmIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-zm" {...props} />
export const FlagSnIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-sn" {...props} />
export const FlagCiIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-ci" {...props} />
export const FlagCmIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-cm" {...props} />
export const FlagCdIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-cd" {...props} />
export const FlagEtIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-et" {...props} />
export const FlagDzIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-dz" {...props} />
export const FlagLyIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-ly" {...props} />
export const FlagTnIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-tn" {...props} />
export const FlagLrIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-lr" {...props} />
export const FlagSlIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-sl" {...props} />
export const FlagGnIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-gn" {...props} />
export const FlagGwIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-gw" {...props} />
export const FlagGmIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-gm" {...props} />
export const FlagBfIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-bf" {...props} />
export const FlagMlIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-ml" {...props} />
export const FlagNeIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-ne" {...props} />
export const FlagTdIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-td" {...props} />
export const FlagCfIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-cf" {...props} />
export const FlagCgIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-cg" {...props} />
export const FlagGaIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-ga" {...props} />
export const FlagGqIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-gq" {...props} />
export const FlagStIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-st" {...props} />
export const FlagAoIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-ao" {...props} />
export const FlagNaIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-na" {...props} />
export const FlagSzIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-sz" {...props} />
export const FlagLsIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-ls" {...props} />
export const FlagBiIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-bi" {...props} />
export const FlagRwIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-rw" {...props} />
export const FlagDjIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-dj" {...props} />
export const FlagSoIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-so" {...props} />
export const FlagErIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-er" {...props} />
export const FlagSsIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-ss" {...props} />
export const FlagSdIcon = (props: Omit<IconProps, 'name'>) => <Icon name="flag-sd" {...props} />
export const CameroonIcon = (props: Omit<IconProps, 'name'>) => <Icon name="cameroon" {...props} />
export const CongoIcon = (props: Omit<IconProps, 'name'>) => <Icon name="congo" {...props} />
export const EthiopiaIcon = (props: Omit<IconProps, 'name'>) => <Icon name="ethiopia" {...props} />
export const AlgeriaIcon = (props: Omit<IconProps, 'name'>) => <Icon name="algeria" {...props} />
export const LibyaIcon = (props: Omit<IconProps, 'name'>) => <Icon name="libya" {...props} />
export const TunisiaIcon = (props: Omit<IconProps, 'name'>) => <Icon name="tunisia" {...props} />
export const LiberiaIcon = (props: Omit<IconProps, 'name'>) => <Icon name="liberia" {...props} />
export const SierraLeoneIcon = (props: Omit<IconProps, 'name'>) => <Icon name="sierra-leone" {...props} />
export const GuineaIcon = (props: Omit<IconProps, 'name'>) => <Icon name="guinea" {...props} />
export const GuineaBissauIcon = (props: Omit<IconProps, 'name'>) => <Icon name="guinea-bissau" {...props} />
export const GambiaIcon = (props: Omit<IconProps, 'name'>) => <Icon name="gambia" {...props} />
export const BurkinaFasoIcon = (props: Omit<IconProps, 'name'>) => <Icon name="burkina-faso" {...props} />
export const MaliIcon = (props: Omit<IconProps, 'name'>) => <Icon name="mali" {...props} />
export const NigerIcon = (props: Omit<IconProps, 'name'>) => <Icon name="niger" {...props} />
export const ChadIcon = (props: Omit<IconProps, 'name'>) => <Icon name="chad" {...props} />
export const CentralAfricanRepublicIcon = (props: Omit<IconProps, 'name'>) => <Icon name="central-african-republic" {...props} />
export const RepublicOfCongoIcon = (props: Omit<IconProps, 'name'>) => <Icon name="republic-of-congo" {...props} />
export const GabonIcon = (props: Omit<IconProps, 'name'>) => <Icon name="gabon" {...props} />
export const EquatorialGuineaIcon = (props: Omit<IconProps, 'name'>) => <Icon name="equatorial-guinea" {...props} />
export const SaoTomeAndPrincipeIcon = (props: Omit<IconProps, 'name'>) => <Icon name="sao-tome-and-principe" {...props} />
export const AngolaIcon = (props: Omit<IconProps, 'name'>) => <Icon name="angola" {...props} />
export const NamibiaIcon = (props: Omit<IconProps, 'name'>) => <Icon name="namibia" {...props} />
export const EswatiniIcon = (props: Omit<IconProps, 'name'>) => <Icon name="eswatini" {...props} />
export const LesothoIcon = (props: Omit<IconProps, 'name'>) => <Icon name="lesotho" {...props} />
export const BurundiIcon = (props: Omit<IconProps, 'name'>) => <Icon name="burundi" {...props} />
export const RwandaIcon = (props: Omit<IconProps, 'name'>) => <Icon name="rwanda" {...props} />
export const DjiboutiIcon = (props: Omit<IconProps, 'name'>) => <Icon name="djibouti" {...props} />
export const SomaliaIcon = (props: Omit<IconProps, 'name'>) => <Icon name="somalia" {...props} />
export const EritreaIcon = (props: Omit<IconProps, 'name'>) => <Icon name="eritrea" {...props} />
export const SouthSudanIcon = (props: Omit<IconProps, 'name'>) => <Icon name="south-sudan" {...props} />
export const SudanIcon = (props: Omit<IconProps, 'name'>) => <Icon name="sudan" {...props} />

// Export the main Icon component and all convenience components
export default Icon
