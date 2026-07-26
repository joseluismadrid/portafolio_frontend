import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BotonesRedes } from './botones-redes';

describe('BotonesRedes', () => {
  let component: BotonesRedes;
  let fixture: ComponentFixture<BotonesRedes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BotonesRedes],
    }).compileComponents();

    fixture = TestBed.createComponent(BotonesRedes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
