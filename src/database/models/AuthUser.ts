import {
    AllowNull,
    BelongsToMany,
    Column,
    DataType,
    Default,
    Model,
    NotNull,
    PrimaryKey,
    Table,
    Unique
} from "sequelize-typescript";
import {AuthUserRole} from "./AuthUserRole";
import {BelongsToManyGetAssociationsMixin, BelongsToManySetAssociationsMixin, NonAttribute} from "sequelize";
import {AuthRole} from "./AuthRole";


// noinspection JSAnnotator
@Table({
    timestamps: true,
})
export class AuthUser extends Model<AuthUser> {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    declare id: string;

    @AllowNull(false)
    @NotNull
    @Unique
    @Column({type: DataType.STRING})
    username: string;

    @AllowNull(false)
    @NotNull
    @Column({type: DataType.STRING})
    password: string;

    @AllowNull(false)
    @NotNull
    @Unique
    @Column({type: DataType.STRING})
    email: string;

    @Default(() => '')
    @Column({type: DataType.STRING})
    firstName: string;

    @Default(() => '')
    @Column({type: DataType.STRING})
    lastName: string;

    @Default(() => ({}))
    @Column({type: DataType.JSON})
    meta: any;

    @BelongsToMany(() => AuthRole, () => AuthUserRole)
    declare roles: NonAttribute<AuthRole[]>;

    declare getRoles: BelongsToManyGetAssociationsMixin<AuthRole>;
    declare setRoles: BelongsToManySetAssociationsMixin<AuthRole, AuthRole['id']>;

    async toJSON() {
        const json: any = super.toJSON();
        delete json.password;
        json.roles = (await this.getRoles()).map(r => ({id: r.id, role: r.role}));
        return json;
    }
}