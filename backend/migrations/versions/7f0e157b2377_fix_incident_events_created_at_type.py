"""fix incident_events created_at type

Revision ID: 7f0e157b2377
Revises: e287118f5679
Create Date: 2026-09-07 12:55:32.819716

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '7f0e157b2377'
down_revision: Union[str, Sequence[str], None] = 'e287118f5679'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        'incident_events', 'created_at',
        existing_type=sa.VARCHAR(),
        type_=sa.DateTime(),
        nullable=False,
        postgresql_using='created_at::timestamp without time zone',
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        'incident_events', 'created_at',
        existing_type=sa.DateTime(),
        type_=sa.VARCHAR(),
        nullable=True,
        postgresql_using='created_at::varchar',
    )