type EnemyWordProps = {
  word: string;
};

// The text, in steel with a snow copy on top that fades in as the word closes in (opacity, not color).
function Text({ word }: { word: string }) {
  return (
    <span className="relative block whitespace-nowrap text-steel">
      {word}
      <span data-enemy-snow className="absolute inset-0 text-snow opacity-0">
        {word}
      </span>
    </span>
  );
}

// One of the four main ENEMIES. Anchored at the camera's centre; the Preloader moves [data-enemy] in
// perspective and jitters [data-tremble] just before the stop. On the slash the Preloader clips the two
// halves along the real cut line (clip-path polygons in the word's own coordinates) and parts them.
// Until then the first half shows the whole word and the second is hidden.
export function EnemyWord({ word }: EnemyWordProps) {
  return (
    <div data-tremble className="absolute top-1/2 left-1/2">
      <div data-enemy data-reveal className="h2 relative">
        {/* Sizer: gives the word its box; the halves draw the visible text. */}
        <span className="invisible block whitespace-nowrap">{word}</span>
        <div data-half="a" className="absolute inset-0">
          <Text word={word} />
        </div>
        <div data-half="b" className="invisible absolute inset-0">
          <Text word={word} />
        </div>
      </div>
    </div>
  );
}
