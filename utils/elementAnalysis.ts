import type { ElementInfo } from '@/types/editor'

type Fiber = {
  return: Fiber | null
  _debugOwner: Fiber | null
  alternate: Fiber | null
  _debugSource?: {
    fileName: string
    lineNumber: number
    columnNumber: number
  }
  type: any
  elementType: any
  tag: number
  stateNode: any
}

export function getElementInfo(element: HTMLElement): ElementInfo {
  const fiber = getFiberFromElement(element)
  
  if (!fiber) {
    return {
      componentName: element.tagName.toLowerCase(),
      position: { line: 0, column: 0 },
      parentChain: [element.tagName.toLowerCase()],
      computedStyles: getComputedStylesObject(element),
      tagName: element.tagName.toLowerCase(),
    }
  }

  const componentName = getComponentName(fiber)
  const position = getSourcePosition(fiber)
  const parentChain = getComponentHierarchy(fiber)

  return {
    componentName,
    position,
    parentChain,
    computedStyles: getComputedStylesObject(element),
    tagName: element.tagName.toLowerCase(),
  }
}

function getFiberFromElement(element: HTMLElement): Fiber | null {
  const keys = Object.keys(element)
  const fiberKey = keys.find(key => 
    key.startsWith('__reactFiber$') || 
    key.startsWith('__reactInternalInstance$')
  )
  
  if (!fiberKey) return null
  
  return (element as any)[fiberKey] as Fiber
}

function getComponentName(fiber: Fiber): string {
  if (!fiber) return 'Unknown'
  
  if (typeof fiber.type === 'string') {
    return fiber.type
  }
  
  if (fiber.type?.name) {
    return fiber.type.name
  }
  
  if (fiber.elementType?.name) {
    return fiber.elementType.name
  }
  
  if (typeof fiber.type === 'function') {
    return fiber.type.displayName || fiber.type.name || 'Anonymous'
  }
  
  return 'Unknown'
}

function getSourcePosition(fiber: Fiber): { line: number; column: number } {
  let currentFiber: Fiber | null = fiber
  
  while (currentFiber) {
    if (currentFiber._debugSource) {
      return {
        line: currentFiber._debugSource.lineNumber,
        column: currentFiber._debugSource.columnNumber,
      }
    }
    
    if (currentFiber.alternate?._debugSource) {
      return {
        line: currentFiber.alternate._debugSource.lineNumber,
        column: currentFiber.alternate._debugSource.columnNumber,
      }
    }
    
    if (currentFiber._debugOwner?._debugSource) {
      return {
        line: currentFiber._debugOwner._debugSource.lineNumber,
        column: currentFiber._debugOwner._debugSource.columnNumber,
      }
    }
    
    if (currentFiber.alternate?._debugOwner?._debugSource) {
      return {
        line: currentFiber.alternate._debugOwner._debugSource.lineNumber,
        column: currentFiber.alternate._debugOwner._debugSource.columnNumber,
      }
    }
    
    currentFiber = currentFiber.return
  }
  
  const owner = (fiber as any)._owner
  if (owner?._debugSource) {
    return {
      line: owner._debugSource.lineNumber,
      column: owner._debugSource.columnNumber,
    }
  }
  
  if (owner?.alternate?._debugSource) {
    return {
      line: owner.alternate._debugSource.lineNumber,
      column: owner.alternate._debugSource.columnNumber,
    }
  }
  
  return { line: 0, column: 0 }
}

function getComponentHierarchy(fiber: Fiber): string[] {
  const hierarchy: string[] = []
  let currentFiber: Fiber | null = fiber
  
  while (currentFiber) {
    const name = getComponentName(currentFiber)
    
    if (name && !shouldSkipComponent(name)) {
      hierarchy.unshift(name)
    }
    
    currentFiber = currentFiber.return
  }
  
  return hierarchy.length > 0 ? hierarchy : ['Unknown']
}

function shouldSkipComponent(name: string): boolean {
  const skipPatterns = [
    'Unknown',
    'Fragment',
    'Suspense',
    'StrictMode',
    'Profiler',
    '_c',
    '_N',
    'Context.Provider',
    'Context.Consumer',
  ]
  
  return skipPatterns.some(pattern => name.includes(pattern))
}

// Helper: Extract computed CSS styles from an element
export function getComputedStylesObject(element: HTMLElement): Record<string, string> {
  const computed = window.getComputedStyle(element)
  const styles: Record<string, string> = {}

  const properties = [
    'display',
    'position',
    'width',
    'height',
    'padding',
    'margin',
    'border',
    'backgroundColor',
    'color',
    'fontSize',
    'fontFamily',
    'fontWeight',
    'lineHeight',
    'textAlign',
    'flexDirection',
    'justifyContent',
    'alignItems',
    'gap',
    'zIndex',
    'opacity',
    'transform',
    'transition',
  ]

  properties.forEach(prop => {
    styles[prop] = computed.getPropertyValue(prop)
  })

  return styles
}
