import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAssetListComponent } from './user-asset-list.component';

describe('UserAssetListComponent', () => {
  let component: UserAssetListComponent;
  let fixture: ComponentFixture<UserAssetListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserAssetListComponent]
    });
    fixture = TestBed.createComponent(UserAssetListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
