/**
 * @license
 * Copyright Alibaba.com All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import {
  AfterViewInit,
  ComponentFactory,
  ComponentFactoryResolver,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  ViewContainerRef
} from '@angular/core';
import { warnDeprecation, NgStyleInterface, NzNoAnimationDirective, NzTSType } from 'ng-zorro-antd/core';
import { Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { NzTooltipBaseComponent } from './nz-tooltip-base.component';
import { NzTooltipTrigger } from './nz-tooltip.definitions';

export abstract class NzTooltipBaseDirective implements OnChanges, OnInit, OnDestroy, AfterViewInit {
  directiveNameTitle?: NzTSType | null;
  specificTitle?: NzTSType | null;
  directiveNameContent?: NzTSType | null;
  specificContent?: NzTSType | null;
  specificTrigger?: NzTooltipTrigger;
  specificPlacement?: string;

  /**
   * @deprecated 10.0.0. This is deprecated and going to be removed in 10.0.0.
   * Please use a more specific API. Like `nzTooltipTitle`.
   */
  @Input() nzTitle: NzTSType | null;

  /**
   * @deprecated 10.0.0. This is deprecated and going to be removed in 10.0.0.
   * Please use a more specific API. Like `nzPopoverContent`.
   */
  @Input() nzContent: NzTSType | null;

  /**
   * @deprecated 10.0.0. This is deprecated and going to be removed in 10.0.0.
   * Please use a more specific API. Like `nzTooltipTrigger`.
   */
  @Input() nzTrigger: NzTooltipTrigger = 'hover';

  /**
   * @deprecated 10.0.0. This is deprecated and going to be removed in 10.0.0.
   * Please use a more specific API. Like `nzTooltipPlacement`.
   */
  @Input() nzPlacement: string = 'top';

  @Input() nzMouseEnterDelay: number;
  @Input() nzMouseLeaveDelay: number;
  @Input() nzOverlayClassName: string;
  @Input() nzOverlayStyle: NgStyleInterface;
  @Input() nzVisible: boolean;

  /**
   * For create tooltip dynamically. This should be override for each different component.
   */
  protected componentFactory: ComponentFactory<NzTooltipBaseComponent>;

  /**
   * This true title that would be used in other parts on this component.
   */
  protected get title(): NzTSType | null {
    return this.specificTitle || this.directiveNameTitle || this.nzTitle;
  }

  protected get content(): NzTSType | null {
    return this.specificContent || this.directiveNameContent || this.nzContent;
  }

  protected get placement(): string {
    return this.specificPlacement || this.nzPlacement;
  }

  protected get trigger(): NzTooltipTrigger {
    // NzTooltipTrigger can be null.
    return typeof this.specificTrigger !== 'undefined' ? this.specificTrigger : this.nzTrigger;
  }

  protected needProxyProperties = [
    'nzOverlayClassName',
    'nzOverlayStyle',
    'nzMouseEnterDelay',
    'nzMouseLeaveDelay',
    'nzVisible',
    'noAnimation'
  ];

  @Output() readonly nzVisibleChange = new EventEmitter<boolean>();

  isTooltipComponentVisible = false;
  tooltip: NzTooltipBaseComponent;

  protected readonly $destroy = new Subject<void>();
  protected readonly triggerDisposables: Array<() => void> = [];

  private delayTimer?: number;

  constructor(
    public elementRef: ElementRef,
    protected hostView: ViewContainerRef,
    protected resolver: ComponentFactoryResolver,
    protected renderer: Renderer2,
    protected noAnimation?: NzNoAnimationDirective
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const { nzTrigger, specificTrigger } = changes;
    const trigger = specificTrigger || nzTrigger;

    if (trigger && !trigger.isFirstChange()) {
      this.registerTriggers();
    }

    if (this.tooltip) {
      this.updateChangedProperties(changes);
    }

    if (changes.nzTitle) {
      warnDeprecation(
        `'nzTitle' of 'nz-tooltip' is deprecated and will be removed in 10.0.0.
Please use 'nzTooltipTitle' instead. The same with 'nz-popover' and 'nz-popconfirm'.`
      );
    }

    if (changes.nzContent) {
      warnDeprecation(
        `'nzContent' of 'nz-popover' is deprecated and will be removed in 10.0.0.
Please use 'nzPopoverContent' instead.`
      );
    }

    if (changes.nzPlacement) {
      warnDeprecation(
        `'nzPlacement' of 'nz-tooltip' is deprecated and will be removed in 10.0.0.
Please use 'nzTooltipContent' instead. The same with 'nz-popover' and 'nz-popconfirm'.`
      );
    }

    if (changes.nzTrigger) {
      warnDeprecation(
        `'nzTrigger' of 'nz-tooltip' is deprecated and will be removed in 10.0.0.
Please use 'nzTooltipTrigger' instead. The same with 'nz-popover' and 'nz-popconfirm'.`
      );
    }
  }

  ngOnInit(): void {
    this.createTooltipComponent();
    this.tooltip.nzVisibleChange
      .pipe(
        distinctUntilChanged(),
        takeUntil(this.$destroy)
      )
      .subscribe((visible: boolean) => {
        this.isTooltipComponentVisible = visible;
        this.nzVisibleChange.emit(visible);
      });
  }

  ngAfterViewInit(): void {
    this.registerTriggers();
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();

    // Clear toggling timer. Issue #3875 #4317 #4386
    this.clearTogglingTimer();
    this.removeTriggerListeners();
  }

  show(): void {
    this.tooltip.show();
  }

  hide(): void {
    this.tooltip.hide();
  }

  /**
   * Force the component to update its position.
   */
  updatePosition(): void {
    if (this.tooltip) {
      this.tooltip.updatePosition();
    }
  }

  /**
   * Create a dynamic tooltip component. This method can be override.
   */
  protected createTooltipComponent(): void {
    const tooltipRef = this.hostView.createComponent(this.componentFactory);

    this.tooltip = tooltipRef.instance;

    // Remove the component's DOM because it should be in the overlay container.
    this.renderer.removeChild(
      this.renderer.parentNode(this.elementRef.nativeElement),
      tooltipRef.location.nativeElement
    );
    this.tooltip.setOverlayOrigin(this as CdkOverlayOrigin);

    this.updateChangedProperties(this.needProxyProperties);
  }

  protected registerTriggers(): void {
    // When the method gets invoked, all properties has been synced to the dynamic component.
    // After removing the old API, we can just check the directive's own `nzTrigger`.
    const el = this.elementRef.nativeElement;
    const trigger = this.trigger;

    this.removeTriggerListeners();

    if (trigger === 'hover') {
      let overlayElement: HTMLElement;
      this.triggerDisposables.push(
        this.renderer.listen(el, 'mouseenter', () => {
          this.delayEnterLeave(true, true, this.tooltip.nzMouseEnterDelay);
        })
      );
      this.triggerDisposables.push(
        this.renderer.listen(el, 'mouseleave', () => {
          this.delayEnterLeave(true, false, this.tooltip.nzMouseLeaveDelay);
          if (this.tooltip.overlay.overlayRef && !overlayElement) {
            overlayElement = this.tooltip.overlay.overlayRef.overlayElement;
            this.triggerDisposables.push(
              this.renderer.listen(overlayElement, 'mouseenter', () => {
                this.delayEnterLeave(false, true);
              })
            );
            this.triggerDisposables.push(
              this.renderer.listen(overlayElement, 'mouseleave', () => {
                this.delayEnterLeave(false, false);
              })
            );
          }
        })
      );
    } else if (trigger === 'focus') {
      this.triggerDisposables.push(this.renderer.listen(el, 'focus', () => this.show()));
      this.triggerDisposables.push(this.renderer.listen(el, 'blur', () => this.hide()));
    } else if (trigger === 'click') {
      this.triggerDisposables.push(
        this.renderer.listen(el, 'click', e => {
          e.preventDefault();
          this.show();
        })
      );
    } // Else do nothing because user wants to control the visibility programmatically.
  }

  /**
   * Sync changed properties to the component and trigger change detection in that component.
   */
  protected updateChangedProperties(propertiesOrChanges: string[] | SimpleChanges): void {
    const isArray = Array.isArray(propertiesOrChanges);
    const keys = isArray ? (propertiesOrChanges as string[]) : Object.keys(propertiesOrChanges);

    // tslint:disable-next-line no-any
    keys.forEach((property: any) => {
      if (this.needProxyProperties.indexOf(property) !== -1) {
        // @ts-ignore
        this.updateComponentValue(property, this[property]);
      }
    });

    if (isArray) {
      this.updateComponentValue('nzTitle', this.title);
      this.updateComponentValue('nzContent', this.content);
      this.updateComponentValue('nzPlacement', this.placement);
      this.updateComponentValue('nzTrigger', this.trigger);
    } else {
      const c = propertiesOrChanges as SimpleChanges;
      if (c.specificTitle || c.directiveNameTitle || c.nzTitle) {
        this.updateComponentValue('nzTitle', this.title);
      }
      if (c.specificContent || c.directiveNameContent || c.nzContent) {
        this.updateComponentValue('nzContent', this.content);
      }
      if (c.specificTrigger || c.nzTrigger) {
        this.updateComponentValue('nzTrigger', this.trigger);
      }
      if (c.specificPlacement || c.nzPlacement) {
        this.updateComponentValue('nzPlacement', this.placement);
      }
    }

    this.tooltip.updateByDirective();
  }

  // tslint:disable-next-line no-any
  private updateComponentValue(key: string, value: any): void {
    if (typeof value !== 'undefined') {
      // @ts-ignore
      this.tooltip[key] = value;
    }
  }

  private delayEnterLeave(isOrigin: boolean, isEnter: boolean, delay: number = -1): void {
    if (this.delayTimer) {
      this.clearTogglingTimer();
    } else if (delay > 0) {
      this.delayTimer = setTimeout(() => {
        this.delayTimer = undefined;
        isEnter ? this.show() : this.hide();
      }, delay * 1000);
    } else {
      // `isOrigin` is used due to the tooltip will not hide immediately
      // (may caused by the fade-out animation).
      isEnter && isOrigin ? this.show() : this.hide();
    }
  }

  private removeTriggerListeners(): void {
    this.triggerDisposables.forEach(dispose => dispose());
    this.triggerDisposables.length = 0;
  }

  private clearTogglingTimer(): void {
    if (this.delayTimer) {
      clearTimeout(this.delayTimer);
      this.delayTimer = undefined;
    }
  }
}
