import {
    AllowNull,
    BelongsToMany,
    Column,
    DataType,
    Default,
    Model,
    NotNull,
    PrimaryKey,
    Table
} from "sequelize-typescript";
import {AuthUserRole} from "./AuthUserRole";
import {AuthUser} from "./AuthUser";
import {NonAttribute} from "sequelize";


// noinspection JSAnnotator
@Table({
    timestamps: false,
})
export class AuthRole extends Model<AuthRole> {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    declare id: string;

    @AllowNull(false)
    @NotNull
    @Column(DataType.STRING)
    role: string;

    @AllowNull(false)
    @NotNull
    @Default(false)
    @Column(DataType.BOOLEAN)
    isDefault: boolean;

    @BelongsToMany(() => AuthUser, () => AuthUserRole)
    declare users: NonAttribute<AuthUser[]>;
}