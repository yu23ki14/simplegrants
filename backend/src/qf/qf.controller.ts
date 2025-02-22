import { Controller, Get, ParseIntPipe, Query, Request } from '@nestjs/common';
import { QfService } from './qf.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequestWithUser } from 'src/users/users.interface';

@ApiTags('Quadratic Funding')
@Controller('qf')
export class QfController {
  constructor(private readonly qfService: QfService) {}

  @ApiOperation({
    description:
      'Estimate the matched amount for a donation based on `donationAmount` & `grantId`',
  })
  @ApiOkResponse({
    description:
      "Returns 0 if grant doesn't exist or donationAmount less than or equal to 0.\
      <br />\
      Returns a positive number otherwise",
    type: Number,
  })
  @Get('estimate')
  async estimateMatchedAmount(
    @Query('donationAmount', new ParseIntPipe()) donationAmount: number,
    @Query('grantId') grantId: string,
  ) {
    return await this.qfService.estimateMatchedAmount(donationAmount, grantId);
  }

  // estimate multiple donations
  @ApiOperation({
    description:
      'Estimate the matched amount for multiple donations based on `donationAmounts` & `grantIds`',
  })
  @ApiOkResponse({
    description:
      'Returns an array of numbers. Each number corresponds to the matched amount for the corresponding donation',
  })
  @Get('estimate/multiple')
  async estimateMatchedAmounts(
    @Query('donationAmounts') donationAmounts: string,
    @Query('grantIds') grantIds: string,
    @Request() req: RequestWithUser,
  ) {
    const params = donationAmounts.split(',').map((amount, index) => {
      return { grantId: grantIds.split(',')[index], amount: parseInt(amount) };
    });
    return await this.qfService.estimateMatchedAmounts(params, req.user);
  }
}
