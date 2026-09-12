import { DefaultNav } from '@payloadcms/next/rsc'
import type { PayloadRequest, ServerProps } from 'payload'

import {
  defaultCmsNavigationVisibility,
  filterVisibleEntities,
  parseCmsNavigationVisibility,
  type CmsNavigationVisibility,
} from '../utilities/cmsNavigation'

type ConfigurableNavProps = ServerProps & { req?: PayloadRequest }

export default async function ConfigurableNav(props: ConfigurableNavProps) {
  if (!props.visibleEntities) return <DefaultNav {...props} />

  let visibility: CmsNavigationVisibility = defaultCmsNavigationVisibility

  try {
    const settings = await props.payload.findGlobal({
      slug: 'cms-settings',
      depth: 0,
      overrideAccess: true,
      req: props.req,
    })
    visibility = parseCmsNavigationVisibility(settings)
  } catch {
    // Keep every permitted section visible when settings cannot be loaded.
  }

  return (
    <DefaultNav
      {...props}
      visibleEntities={filterVisibleEntities(props.visibleEntities, visibility)}
    />
  )
}
