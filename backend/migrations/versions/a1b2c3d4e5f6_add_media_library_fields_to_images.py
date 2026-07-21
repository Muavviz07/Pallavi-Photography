"""add media library fields to images

Revision ID: a1b2c3d4e5f6
Revises: c64d5b2191e3
Create Date: 2026-07-05 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "c64d5b2191e3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("images", sa.Column("uploaded_by_id", sa.Uuid(), nullable=True))
    op.add_column("images", sa.Column("category", sa.String(length=100), nullable=True))
    op.add_column(
        "images",
        sa.Column("usage_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index(op.f("ix_images_uploaded_by_id"), "images", ["uploaded_by_id"], unique=False)
    op.create_index(op.f("ix_images_category"), "images", ["category"], unique=False)
    op.create_index(op.f("ix_images_original_url"), "images", ["original_url"], unique=True)
    op.create_foreign_key(
        "fk_images_uploaded_by_id_users",
        "images",
        "users",
        ["uploaded_by_id"],
        ["id"],
    )
    op.alter_column("images", "usage_count", server_default=None)


def downgrade() -> None:
    op.drop_constraint("fk_images_uploaded_by_id_users", "images", type_="foreignkey")
    op.drop_index(op.f("ix_images_original_url"), table_name="images")
    op.drop_index(op.f("ix_images_category"), table_name="images")
    op.drop_index(op.f("ix_images_uploaded_by_id"), table_name="images")
    op.drop_column("images", "usage_count")
    op.drop_column("images", "category")
    op.drop_column("images", "uploaded_by_id")
