import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LoanService } from './loan.service';

@Controller('loan')
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

}
