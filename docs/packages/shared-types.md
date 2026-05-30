# packages/shared-types

> 端到端共享的 TypeScript 类型。**纯类型，无 runtime 代码**。
>
> 目录：[`packages/shared-types/`](../../packages/shared-types/) ｜ 包名：`@studyzone/shared-types`

---

## 一、为什么单独存在

后端 NestJS 用 class-validator 装饰器写 DTO，前端 Web / Mobile / Admin 不需要也不能引入这些装饰器（会拖入 `reflect-metadata` 等运行时）。所以：

- **类型层**：所有公开 DTO / 枚举 / 事件 / 题目结构在这里集中维护，用 `interface` / `type`。
- **校验层**：后端 DTO 实现仍写在 `apps/api/src/modules/<x>/<x>.dto.ts`，并 `implements` 这里的接口。

---

## 二、目录

```
packages/shared-types/src/
├─ index.ts        # 统一 re-export
├─ enums.ts        # 离散值枚举（ExerciseType / SubjectCode / Locale / LeagueTier / ...）
├─ exercise.ts     # 各题型 prompt / answer / userAttempt 的 discriminated union
├─ dto.ts          # 请求 / 响应 DTO（Auth / Account / Content / Learning / ...）
├─ events.ts       # 内部事件总线 payload 类型
└─ selectors.ts    # Prisma `select` 重用（保持后端使用统一字段子集）
```

---

## 三、使用示例

```ts
import {
  ExerciseType,
  TranslateChoicePrompt,
  RegisterDto,
  UserProfile,
} from '@studyzone/shared-types';
```

```ts
// 后端 DTO 实现 + 校验
import { IsEmail, IsString, MinLength } from 'class-validator';
import type { RegisterDto as IRegisterDto } from '@studyzone/shared-types';

export class RegisterDto implements IRegisterDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsString() nickname!: string;
}
```

---

## 四、约定

- 不在这里定义业务函数 / 工具函数；那些归 `shared-logic`。
- 不依赖任何 runtime 库；保证前端打包后 0 字节。
- 字段一旦在 prod 使用，就**只增不删**；删除字段需先标 `@deprecated`，下次破坏性版本再移除。

---

## 五、相关

- [API 规范](../architecture/03-api.md)
- [shared-logic](./shared-logic.md)
- [api-client](./api-client.md)
