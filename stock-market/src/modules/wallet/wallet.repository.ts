import { Injectable } from "@nestjs/common";
import { db } from "../../database/kysely.provider";
import { DbExecutor } from "../../database/types/dbContext";
import { Wallet } from "../../database/types/wallet.types";


@Injectable()
export class WalletRepository {
    public findWalletById = async (wallet_id: string, exec: DbExecutor = db): Promise<Wallet | undefined> => {
        return await exec
        .selectFrom('wallets')
        .selectAll()
        .where('id', '=', wallet_id)
        .executeTakeFirst();
    }

    public createWallet = async (id: string, exec: DbExecutor): Promise<void> => {
        await exec
        .insertInto('wallets')
        .values({
            id: id
        })
        .execute();
    }
}