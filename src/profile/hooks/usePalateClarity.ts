import { useMemo } from "react"
import { computePalateClarity, PalateClarityTasting } from "../../palate/palateClarity.service"

export function usePalateClarity(tastings: PalateClarityTasting[] | null | undefined) {
  const clarity = useMemo(() => {
    if (!tastings || tastings.length === 0) return null
    return computePalateClarity(tastings)
  }, [tastings])

  return clarity
}