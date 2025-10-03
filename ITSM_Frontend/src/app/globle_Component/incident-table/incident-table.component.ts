import { Component } from '@angular/core';
import { PrimengModule } from 'src/app/primeng/primeng.module';

@Component({
  selector: 'app-incident-table',
  templateUrl: './incident-table.component.html',
  styleUrls: ['./incident-table.component.scss'],
  standalone: true,
  imports: [PrimengModule]
})
export class IncidentTableComponent {
  tickets = [
    {
      id: '#SUP0001180',
      status: 'On-Hold',
      title: 'Conversation from Facebook Page ',
      category: 'Support',
      assignee: '',
      raisedBy: 'Vivek Sivakumar',
      priority: 'P3',
      dueDate: '~',
      comments: 'test chat message',
      badgeColor: '#f49831',
    },
    {
      id: '#SUP0001181',
      status: 'OPEN',
      title: 'Acme Widgets ',
      category: 'Support',
      assignee: 'Vivek',
      raisedBy: 'Vivek Sivakumar',
      priority: 'P3',
      dueDate: 'Today',
      comments: 'liked and commented',
      badgeColor: '#539cd5',
    },
    {
      id: '#SUP0001183',
      status: 'CLOSED',
      title: 'prowise demo',
      category: 'Support',
      assignee: '',
      raisedBy: 'Vivek',
      priority: 'P3',
      dueDate: 'Sep 28, 2017',
      comments: 'demo',
      badgeColor: 'grey',
    }
  ];
  
  sortOptions = [
    { label: 'Last 7 Days', value: '7' },
    { label: 'Last 15 Days', value: '15' },
    { label: 'Last Month', value: '30' }
  ];
  
  selectedSort = 'recent';
  
}
