import { createZodDto } from '@anatine/zod-nestjs';
import { DateTime } from 'luxon';
import { z } from 'zod';

const CreateAndSendEmergencySchema = z
  .object({
    chargingStationId: z.number().int().positive(),
    periodStartAt: z
      .string()
      .datetime({ offset: true })
      .transform(transformFromISOToDate)
      .refine(validateDateIsToday, {
        message: 'must be today',
      })
      .refine(validateDateIsAtLeast15MinutesLater, {
        message: 'must be later than 15 minutes from now',
      }),
    periodEndAt: z
      .string()
      .datetime({ offset: true })
      .transform(transformFromISOToDate)
      .refine(validateDateBeforeTomorrow, {
        message: 'must be before tomorrow',
      }),
    capacity: z.number().int().positive(),
  })
  .refine(validatePeriodEndAfterStart, {
    message: 'periodEndAt must be after periodStartAt',
  });

export class CreateAndSendEmergencyDto extends createZodDto(
  CreateAndSendEmergencySchema,
) {}

function transformFromISOToDate(isoString: string) {
  return DateTime.fromISO(isoString).toJSDate();
}

function validateDateIsToday(date: Date) {
  const datetime = DateTime.fromJSDate(date);
  return datetime.hasSame(DateTime.now(), 'day');
}

function validateDateIsAtLeast15MinutesLater(date: Date) {
  const datetime = DateTime.fromJSDate(date);
  return datetime >= DateTime.now().plus({ minutes: 15 });
}

function validateDateBeforeTomorrow(date: Date) {
  const datetime = DateTime.fromJSDate(date);
  return datetime <= DateTime.now().plus({ days: 1 }).startOf('day');
}

function validatePeriodEndAfterStart(data) {
  return (
    DateTime.fromJSDate(data.periodEndAt) >
    DateTime.fromJSDate(data.periodStartAt)
  );
}
