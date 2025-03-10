/**
 * @license
 * Copyright Alibaba.com All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  Host,
  Input,
  Optional,
  TemplateRef,
  ViewEncapsulation
} from '@angular/core';

import { zoomBigMotion, NzNoAnimationDirective, NzTSType } from 'ng-zorro-antd/core';

import { isTooltipEmpty, NzTooltipBaseComponent } from './nz-tooltip-base.component';

@Component({
  selector: 'nz-tooltip',
  exportAs: 'nzTooltipComponent',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  animations: [zoomBigMotion],
  templateUrl: './nz-tooltip.component.html',
  preserveWhitespaces: false,
  styles: [
    `
      .ant-tooltip {
        position: relative;
      }
    `
  ]
})
export class NzToolTipComponent extends NzTooltipBaseComponent {
  @Input() nzTitle: NzTSType | null;
  @ContentChild('nzTemplate', { static: true }) nzTitleTemplate: TemplateRef<void>;

  constructor(cdr: ChangeDetectorRef, @Host() @Optional() public noAnimation?: NzNoAnimationDirective) {
    super(cdr);
  }

  protected isEmpty(): boolean {
    return isTooltipEmpty(this.title);
  }
}
