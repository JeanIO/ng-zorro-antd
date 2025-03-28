import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { fakeAsync, inject, tick, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { dispatchMouseEvent } from 'ng-zorro-antd/core';
import { NzIconTestModule } from 'ng-zorro-antd/icon/testing';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { NzPopconfirmModule } from './nz-popconfirm.module';

describe('NzPopconfirm', () => {
  let overlayContainer: OverlayContainer;
  let overlayContainerElement: HTMLElement;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [NzPopconfirmModule, NoopAnimationsModule, NzToolTipModule, NzIconTestModule],
      declarations: [NzpopconfirmTestNewComponent]
    });

    TestBed.compileComponents();
  }));

  beforeEach(inject([OverlayContainer], (oc: OverlayContainer) => {
    overlayContainer = oc;
    overlayContainerElement = oc.getContainerElement();
  }));

  afterEach(() => {
    overlayContainer.ngOnDestroy();
  });

  let fixture: ComponentFixture<NzpopconfirmTestNewComponent>;
  let component: NzpopconfirmTestNewComponent;

  function getTitleText(): Element | null {
    return overlayContainerElement.querySelector('.ant-popover-message-title');
  }

  function getTooltipTrigger(index: number): Element {
    return overlayContainerElement.querySelectorAll('.ant-popover-buttons button')[index];
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(NzpopconfirmTestNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function waitingForTooltipToggling(): void {
    fixture.detectChanges();
    tick(500);
    fixture.detectChanges();
  }

  it('should support custom icon', fakeAsync(() => {
    component.icon = 'question-circle';
    const triggerElement = component.iconTemplate.nativeElement;
    dispatchMouseEvent(triggerElement, 'click');
    waitingForTooltipToggling();
    expect(overlayContainerElement.querySelector('.anticon-exclamation-circle')).toBeFalsy();
  }));

  it('should nzOk work', () => {
    const triggerElement = component.stringTemplate.nativeElement;
    dispatchMouseEvent(triggerElement, 'click');
    fixture.detectChanges();
    expect(getTooltipTrigger(0).textContent).toContain('cancel-text');
    expect(getTooltipTrigger(1).textContent).toContain('ok-text');
    expect(getTooltipTrigger(1).classList).not.toContain('ant-btn-primary');
  });

  it('should cancel work', fakeAsync(() => {
    const triggerElement = component.stringTemplate.nativeElement;

    dispatchMouseEvent(triggerElement, 'click');
    fixture.detectChanges();
    expect(getTitleText()!.textContent).toContain('title-string');
    expect(component.confirm).toHaveBeenCalledTimes(0);
    expect(component.cancel).toHaveBeenCalledTimes(0);

    dispatchMouseEvent(getTooltipTrigger(0), 'click');
    waitingForTooltipToggling();
    expect(component.confirm).toHaveBeenCalledTimes(0);
    expect(component.cancel).toHaveBeenCalledTimes(1);
    expect(getTitleText()).toBeNull();
  }));

  it('should confirm work', fakeAsync(() => {
    const triggerElement = component.stringTemplate.nativeElement;

    dispatchMouseEvent(triggerElement, 'click');
    fixture.detectChanges();
    expect(getTitleText()!.textContent).toContain('title-string');
    expect(component.confirm).toHaveBeenCalledTimes(0);
    expect(component.cancel).toHaveBeenCalledTimes(0);

    dispatchMouseEvent(getTooltipTrigger(1), 'click');
    waitingForTooltipToggling();
    expect(component.confirm).toHaveBeenCalledTimes(1);
    expect(component.cancel).toHaveBeenCalledTimes(0);
    expect(getTitleText()).toBeNull();
  }));

  it('should condition work', fakeAsync(() => {
    expect(component.confirm).toHaveBeenCalledTimes(0);
    expect(component.cancel).toHaveBeenCalledTimes(0);

    component.condition = true;
    fixture.detectChanges();
    const triggerElement = component.stringTemplate.nativeElement;

    dispatchMouseEvent(triggerElement, 'click');
    fixture.detectChanges();
    expect(getTitleText()).toBeNull();
    expect(component.confirm).toHaveBeenCalledTimes(1);
    expect(component.cancel).toHaveBeenCalledTimes(0);
  }));
});

@Component({
  template: `
    <a
      nz-popconfirm
      #stringTemplate
      nzTitle="title-string"
      nzOkText="ok-text"
      nzOkType="default"
      nzCancelText="cancel-text"
      [nzCondition]="condition"
      (nzOnConfirm)="confirm()"
      (nzOnCancel)="cancel()"
    >
      Delete
    </a>
    <a
      nz-popconfirm
      #templateTemplate
      [nzIcon]="icon"
      [nzTitle]="titleTemplate"
      (nzOnConfirm)="confirm()"
      (nzOnCancel)="cancel()"
    >
      Delete
    </a>

    <a nz-popconfirm #iconTemplate [nzIcon]="icon">
      Delete
    </a>

    <ng-template #titleTemplate>title-template</ng-template>
  `
})
export class NzpopconfirmTestNewComponent {
  confirm = jasmine.createSpy('confirm');
  cancel = jasmine.createSpy('cancel');
  condition = false;
  icon: string | undefined = undefined;

  @ViewChild('stringTemplate', { static: false }) stringTemplate: ElementRef;
  @ViewChild('templateTemplate', { static: false }) templateTemplate: ElementRef;
  @ViewChild('iconTemplate', { static: false }) iconTemplate: ElementRef;
}
