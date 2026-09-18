import { storyProduct, storyMoney } from "./cost-story-model";

/** One teaser points to the main reveal, instead of repeating its calculation. */
export default function HiddenCostStory() {
  return <figure className="hidden-cost-story" aria-labelledby="hidden-cost-caption">
    <figcaption id="hidden-cost-caption">Fictional camera · USD · see beyond the price</figcaption>
    <a className="hidden-cost-teaser" href="#cost-story">
      <span className="hidden-cost-price-label">The price you see</span>
      <span className="hidden-cost-sticker">{storyMoney(storyProduct.price)}</span>
      <span className="hidden-cost-trigger">Reveal the hidden costs<span className="hidden-cost-arrow" aria-hidden="true">↓</span></span>
    </a>
    <p className="hidden-cost-disclaimer">Fictional inputs. Nothing saved.</p>
  </figure>;
}
