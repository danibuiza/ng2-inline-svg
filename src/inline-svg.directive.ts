import {
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';

import SVGCache from './svg-cache.service';

@Directive({
  selector: '[inlineSVG]',
  providers: [SVGCache]
})
export default class InlineSVGDirective implements OnInit, OnChanges {
  @Input() inlineSVG: string;
  @Input() replaceContents: boolean = true;
  @Input() cacheSVG: boolean = true;
  @Input() removeSVGAttributes: Array<string>;

  @Output() onSVGInserted: EventEmitter<SVGElement> = new EventEmitter<SVGElement>();

  private _absUrl: string;

  constructor(
    @Inject(DOCUMENT) private _document: HTMLDocument,
    private _el: ElementRef,
    private _svgCache: SVGCache) {
  }

  ngOnInit(): void {
    this._insertSVG();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['inlineSVG'] &&
      changes['inlineSVG'].currentValue !== changes['inlineSVG'].previousValue) {
      this._insertSVG();
    }
  }

  private _insertSVG(): void {
    // Check if a URL was actually passed into the directive
    if (!this.inlineSVG) {
      console.error('No URL passed to [inlineSVG]!');
      return;
    }

    // Get absolute URL, and check if it's actually new
    const absUrl = this._getAbsoluteUrl(this.inlineSVG);

    if (absUrl !== this._absUrl) {
      this._absUrl = absUrl;

      // Fetch SVG via cache mechanism
      this._svgCache.getSVG(this._absUrl, this.cacheSVG)
        .subscribe(
          (svg: SVGElement) => {
            // Insert SVG
            if (svg && this._el.nativeElement) {
              if (this.replaceContents) {
                this._el.nativeElement.innerHTML = '';
              }

              if (this.removeSVGAttributes) {
                this._removeAttributes(svg, this.removeSVGAttributes);
              }

              this._el.nativeElement.appendChild(svg);
              this.onSVGInserted.emit(svg);
            }
          },
          (err: any) => {
            console.error(err);
          }
        );
    }
  }

  private _getAbsoluteUrl(url: string): string {
    const base = this._document.createElement('BASE') as HTMLBaseElement;
    base.href = url;

    return base.href;
  }

  private _removeAttributes(svg: SVGElement, attrs: Array<string>) {
    const innerEls = svg.getElementsByTagName('*');

    for (let i = 0; i < innerEls.length; i++) {
      const elAttrs = innerEls[i].attributes;

      for (let j = 0; j < elAttrs.length; j++) {
        if (attrs.indexOf(elAttrs[j].name.toLowerCase()) > -1) {
          innerEls[i].removeAttribute(elAttrs[j].name);
        }
      }
    }
  }
}
