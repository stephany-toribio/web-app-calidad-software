import { AfterViewInit, Directive, ElementRef, EventEmitter, HostListener, OnDestroy, Output, inject } from '@angular/core';
@Directive({ selector: '[appAccessibleDialog]', standalone: true })
export class AccessibleDialogDirective implements AfterViewInit, OnDestroy {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private previous: HTMLElement | null = null;
  @Output() dialogDismiss = new EventEmitter<void>();
  private controls(): HTMLElement[] {
    return [...this.element.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')]
      .filter(element => !element.hidden && element.getClientRects().length > 0);
  }
  ngAfterViewInit(): void {
    this.previous = this.element.ownerDocument.activeElement as HTMLElement | null;
    this.element.setAttribute('role', 'dialog');
    this.element.setAttribute('aria-modal', 'true');
    this.element.tabIndex = -1;
    (this.controls()[0] ?? this.element).focus();
  }
  @HostListener('keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') { event.preventDefault(); this.dialogDismiss.emit(); return; }
    if (event.key !== 'Tab') return;
    const controls = this.controls();
    const first = controls[0]; const last = controls.at(-1);
    const active = this.element.ownerDocument.activeElement;
    if (!first) { event.preventDefault(); this.element.focus(); return; }
    if (event.shiftKey && (active === first || active === this.element)) { event.preventDefault(); last!.focus(); }
    else if (!event.shiftKey && (active === last || active === this.element)) { event.preventDefault(); first.focus(); }
  }
  ngOnDestroy(): void { if (this.previous?.isConnected) this.previous.focus(); }
}
