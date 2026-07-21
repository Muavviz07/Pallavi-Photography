"""add_presigned_url_fields

Revision ID: add_presigned_url_fields
Revises: s3_garage_fields_001
Create Date: 2026-07-21 08:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_presigned_url_fields'
down_revision: Union[str, None] = 's3_garage_fields_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('images', sa.Column('url_expiration_time', sa.DateTime(timezone=True), nullable=True))
    op.alter_column('images', 's3_url', existing_type=sa.String(length=1000), type_=sa.String(length=2000))
    op.alter_column('images', 'original_url', existing_type=sa.String(length=1000), type_=sa.String(length=2000))


def downgrade() -> None:
    op.drop_column('images', 'url_expiration_time')
    op.alter_column('images', 's3_url', existing_type=sa.String(length=2000), type_=sa.String(length=1000))
    op.alter_column('images', 'original_url', existing_type=sa.String(length=2000), type_=sa.String(length=1000))
