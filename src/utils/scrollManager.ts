/**
 * 滚动管理器 - 处理键盘导航时的滚动逻辑
 */

interface ScrollOptions {
  container: HTMLElement
  element: HTMLElement
  margin?: number
  behavior?: ScrollBehavior
}

/**
 * 确保元素在容器的可视区域内
 * 使用纯 JavaScript 计算，不依赖 scrollIntoView
 */
export function ensureElementInView(options: ScrollOptions): void {
  const { container, element, margin = 80, behavior = 'smooth' } = options

  // 获取容器和元素的位置信息
  const containerRect = container.getBoundingClientRect()
  const elementRect = element.getBoundingClientRect()

  // 计算元素相对于容器视口的位置
  const relativeTop = elementRect.top - containerRect.top
  const relativeBottom = elementRect.bottom - containerRect.top // 注意：这里应该是相对于容器顶部

  // 容器的可视高度
  const containerVisibleHeight = container.clientHeight

  // 确定是否需要滚动
  let needsScroll = false
  let newScrollTop = container.scrollTop

  // 检查元素是否在可视区域内
  if (relativeTop < margin) {
    // 元素在视口顶部之上或太靠近顶部
    // 需要向上滚动，让元素距离顶部有 margin 的距离
    const scrollDelta = relativeTop - margin
    newScrollTop = container.scrollTop + scrollDelta
    needsScroll = true
  } else if (relativeBottom > containerVisibleHeight - margin) {
    // 元素在视口底部之下或太靠近底部
    // 需要向下滚动，让元素距离底部有 margin 的距离
    const scrollDelta = relativeBottom - (containerVisibleHeight - margin)
    newScrollTop = container.scrollTop + scrollDelta
    needsScroll = true
  }

  // 确保滚动位置在有效范围内
  const maxScrollTop = container.scrollHeight - container.clientHeight
  newScrollTop = Math.max(0, Math.min(maxScrollTop, newScrollTop))

  // 执行滚动
  if (needsScroll && Math.abs(newScrollTop - container.scrollTop) > 1) {
    container.scrollTo({
      top: newScrollTop,
      behavior: behavior
    })
  }
}

/**
 * 获取元素在容器中的索引位置
 */
export function getElementIndex(element: HTMLElement, selector: string): number {
  const allElements = document.querySelectorAll(selector)
  for (let i = 0; i < allElements.length; i++) {
    if (allElements[i] === element) {
      return i
    }
  }
  return -1
}

/**
 * 根据索引滚动到特定元素
 */
export function scrollToElementByIndex(
  index: number,
  selector: string,
  container: HTMLElement,
  margin = 80
): void {
  const allElements = document.querySelectorAll(selector)
  if (index >= 0 && index < allElements.length) {
    const element = allElements[index] as HTMLElement
    ensureElementInView({
      container,
      element,
      margin,
      behavior: 'smooth'
    })
  }
}

/**
 * 检查元素是否在容器的可视区域内
 */
export function isElementInView(element: HTMLElement, container: HTMLElement, margin = 0): boolean {
  const containerRect = container.getBoundingClientRect()
  const elementRect = element.getBoundingClientRect()

  const relativeTop = elementRect.top - containerRect.top
  const relativeBottom = elementRect.bottom - containerRect.top

  const containerHeight = container.clientHeight

  return relativeTop >= margin && relativeBottom <= containerHeight - margin
}